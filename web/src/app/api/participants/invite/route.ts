import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { sendInviteEmail } from '@/lib/emailService';
import { rateLimit } from '@/lib/limiter';

/**
 * POST /api/participants/invite
 *
 * Idempotent participant invite endpoint.
 * Never throws "User already in deal". Always returns 200 on valid input.
 */
export async function POST(request: Request) {
    try {
        // ── 0. Setup clients ─────────────────────────────────────
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY!;

        if (!serviceRoleKey) {
            return NextResponse.json({ error: 'Server misconfigured: missing service role key' }, { status: 500 });
        }

        const cookieStore = await cookies();
        let userClient;

        const authHeader = request.headers.get('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.replace('Bearer ', '');
            userClient = createClient(supabaseUrl, anonKey, {
                auth: { autoRefreshToken: false, persistSession: false },
                global: { headers: { Authorization: `Bearer ${token}` } }
            });
        } else {
            userClient = createServerClient(supabaseUrl, anonKey, {
                cookies: {
                    getAll() { return cookieStore.getAll() },
                    setAll() { }
                }
            });
        }

        const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        // ── 1. Verify caller JWT and staff role ──────────────────
        const { data: { user: caller }, error: authError } = await userClient.auth.getUser();
        if (authError || !caller) {
            return NextResponse.json({ error: 'Invalid token or session expired' }, { status: 401 });
        }

        const { data: callerProfile } = await serviceClient
            .from('users')
            .select('id, role, is_active')
            .eq('id', caller.id)
            .single();

        if (!callerProfile || !callerProfile.is_active || !['admin', 'lawyer', 'staff'].includes(callerProfile.role)) {
            return NextResponse.json({ error: 'Forbidden: staff only' }, { status: 403 });
        }

        // ── 2. Parse & validate request ──────────────────────────
        const body = await request.json();
        const { dealId, participantRole, name, phone, agency, resend: isResend } = body;
        const email = body.email?.toLowerCase()?.trim();

        if (!email) {
            return NextResponse.json({ error: 'Missing required field: email' }, { status: 400 });
        }

        // ── 2.5 Rate Limiting ────────────────────────────────────
        const rateKey = `invite:${caller.id}:${email}`;
        const { ok, reset } = await rateLimit(rateKey, 5, 600);

        if (!ok) {
            console.warn(`Rate limit exceeded for invites: ${rateKey}`);
            return NextResponse.json(
                { error: 'Too many invite attempts. Please wait 10 minutes.' },
                { status: 429, headers: { 'Retry-After': reset ? Math.ceil((reset.getTime() - Date.now()) / 1000).toString() : '600' } }
            );
        }

        if (!dealId) {
            return NextResponse.json({ error: 'Missing required field: dealId' }, { status: 400 });
        }

        let message = '';

        // ── 3. Ensure participants row exists ─────────────────────
        let participantId: string;

        const { data: existingParticipant } = await serviceClient
            .from('participants')
            .select('id, user_id, invitation_status')
            .eq('email', email)
            .maybeSingle();

        if (existingParticipant) {
            participantId = existingParticipant.id;
            console.log(`✅ Participant already exists: ${participantId}`);
        } else {
            participantId = crypto.randomUUID();
            const { error: createErr } = await serviceClient
                .from('participants')
                .insert({
                    id: participantId,
                    email,
                    name: name || email.split('@')[0],
                    phone: phone || null,
                    agency: agency || null,
                    invitation_status: 'pending',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });

            if (createErr) {
                if (createErr.code === '23505') {
                    const { data: retry } = await serviceClient
                        .from('participants')
                        .select('id, user_id, invitation_status')
                        .eq('email', email)
                        .single();
                    if (retry) {
                        participantId = retry.id;
                    } else {
                        throw createErr;
                    }
                } else {
                    throw createErr;
                }
            }
            console.log(`✅ Created new participant: ${participantId}`);
        }

        // ── 4. Ensure deal_participants link ─────────────────────
        const { data: existingLink } = await serviceClient
            .from('deal_participants')
            .select('id')
            .eq('deal_id', dealId)
            .eq('participant_id', participantId)
            .maybeSingle();

        // FIX: Track whether this participant was already in this deal BEFORE this request.
        // This is the key to deciding whether to send an email or not.
        const wasAlreadyLinked = !!existingLink;

        if (wasAlreadyLinked) {
            message = 'already-linked';
            console.log(`✅ Deal-participant link already exists`);
        } else {
            const { error: linkErr } = await serviceClient
                .from('deal_participants')
                .insert({
                    id: crypto.randomUUID(),
                    deal_id: dealId,
                    participant_id: participantId,
                    role: participantRole || 'buyer',
                    joined_at: new Date().toISOString(),
                    permissions: {
                        canViewDocuments: ['broker', 'lawyer', 'staff'].includes(participantRole || ''),
                        canDownloadDocuments: false,
                        canUploadDocuments: true,
                        canViewTimeline: true
                    }
                });

            if (linkErr && linkErr.code !== '23505') {
                console.error('Failed to create deal_participants link:', linkErr);
                throw linkErr;
            }
            message = 'linked';
            console.log(`✅ Created deal-participant link`);
        }

        // ── 5. Ensure auth.users account ─────────────────────────
        let authUserId: string | null = null;
        let isNewUser = false;

        // FIX: Query public.users directly instead of listing all auth users.
        // This is faster, more reliable, and doesn't have a 1000-user cap.
        const { data: existingPublicUser } = await serviceClient
            .from('users')
            .select('id')
            .eq('email', email)
            .maybeSingle();

        if (existingPublicUser) {
            authUserId = existingPublicUser.id;
            console.log(`✅ Existing user found in public.users: ${authUserId}`);
        } else {
            // Not in public.users — create in auth.users
            const { data: createData, error: createError } = await serviceClient.auth.admin.createUser({
                email,
                email_confirm: true,
                password: crypto.randomUUID(),
                user_metadata: {
                    name: name || email.split('@')[0],
                    role: 'user'
                }
            });

            if (createError) {
                if (createError.message?.includes('already been registered') || createError.status === 422) {
                    // FIX: Instead of listUsers({ perPage: 1000 }), use a targeted approach.
                    // User exists in auth but not in public.users (orphaned auth account).
                    // We generate a link for them which also returns their user object.
                    console.log(`ℹ️ Auth user exists but not in public.users. Recovering via generateLink...`);
                    const { data: recoveryData } = await serviceClient.auth.admin.generateLink({
                        type: 'recovery',
                        email,
                    });
                    if (recoveryData?.user?.id) {
                        authUserId = recoveryData.user.id;
                        console.log(`✅ Recovered orphaned auth user: ${authUserId}`);
                    } else {
                        console.error('❌ Could not recover orphaned auth user for:', email);
                    }
                } else {
                    throw createError;
                }
            } else {
                authUserId = createData.user.id;
                isNewUser = true;
                console.log(`✅ Created new auth user: ${authUserId}`);
            }
        }

        // ── 6. Ensure public.users row ───────────────────────────
        if (authUserId && isNewUser) {
            const { error: insertErr } = await serviceClient
                .from('users')
                .upsert({
                    id: authUserId,
                    email,
                    name: name || email.split('@')[0],
                    role: 'user',
                    is_active: true,
                    created_at: new Date().toISOString()
                }, {
                    onConflict: 'id',
                    ignoreDuplicates: true
                });

            if (insertErr) {
                console.warn('⚠️ public.users insert warning:', insertErr.message);
            } else {
                console.log(`✅ public.users row ensured for new user: ${authUserId}`);
            }
        } else if (authUserId) {
            await serviceClient
                .from('users')
                .update({ is_active: true })
                .eq('id', authUserId);
            console.log(`✅ Existing user reactivated: ${authUserId}`);
        }

        // ── 7. Link participants.user_id ─────────────────────────
        const linked = !!authUserId;
        if (authUserId) {
            const { data: currentP } = await serviceClient
                .from('participants')
                .select('user_id')
                .eq('id', participantId)
                .single();

            if (!currentP?.user_id || currentP.user_id !== authUserId) {
                await serviceClient
                    .from('participants')
                    .update({
                        user_id: authUserId,
                        invitation_status: 'invited',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', participantId);
                console.log(`✅ Linked participant ${participantId} → auth user ${authUserId}`);
            }
        }

        // ── 7.5. Back-populate assigned_participant_id on existing tasks ──
        if (participantId && dealId) {
            const { error: taskWireError } = await serviceClient
                .from('tasks')
                .update({ assigned_participant_id: participantId })
                .eq('deal_id', dealId)
                .eq('assigned_to', email)
                .is('assigned_participant_id', null);

            if (taskWireError) {
                console.warn('⚠️ Task wiring warning (non-critical):', taskWireError.message);
            } else {
                console.log(`✅ Wired unlinked tasks in deal ${dealId} → participant ${participantId}`);
            }
        }

        // ── 8. Send invite/recovery email ────────────────────────
        // FIX: Only send email if:
        //   a) This is a brand new participant being linked to this deal for the first time, OR
        //   b) Admin explicitly clicked "Resend" (isResend = true)
        //
        // Do NOT send if the participant was already linked to this deal (wasAlreadyLinked)
        // and this is not an explicit resend — they are already active and working.
        const shouldSendEmail = !wasAlreadyLinked || isResend;
        let invited = false;
        let directLink: string | null = null;

        if (shouldSendEmail) {
            try {
                const { data: deal } = await serviceClient
                    .from('deals')
                    .select('title')
                    .eq('id', dealId)
                    .single();
                const dealTitle = deal?.title || 'Agenzia Deal Room';

                const linkType = isNewUser ? 'recovery' : 'magiclink';
                const { data: linkData, error: linkError } = await serviceClient.auth.admin.generateLink({
                    type: linkType as any,
                    email,
                    options: {
                        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://dealroom.online'}/auth/callback`
                    }
                });

                const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dealroom.online';

                // isExisting = true means "you already have an account, here's your new deal"
                // isExisting = false means "welcome, please set your password"
                const isExistingUser = !isNewUser;

                if (!linkError && linkData?.properties?.action_link) {
                    const actionUrl = new URL(linkData.properties.action_link);
                    const extractedToken = actionUrl.searchParams.get('token');
                    if (isNewUser) {
                        directLink = `${siteUrl}/auth/callback?token_hash=${extractedToken}&type=recovery&new=1`;
                    } else {
                        directLink = `${siteUrl}/auth/callback?token_hash=${extractedToken}&type=magiclink`;
                    }
                } else {
                    if (linkError) {
                        console.warn('⚠️ generateLink failed:', linkError.message, '— using plain login fallback');
                    }
                    directLink = `${siteUrl}/login`;
                }

                console.log('\n══════════════════════════════════════════════════════');
                console.log('🔗 SENDING INVITE LINK TO:', email, isExistingUser ? '(existing user - new deal access)' : '(new user - set password)');
                console.log('══════════════════════════════════════════════════════\n');

                const emailResult = await sendInviteEmail(
                    email,
                    name || email,
                    directLink,
                    participantRole || 'participant',
                    dealTitle,
                    isExistingUser  // drives "welcome" vs "new deal access" email template
                );
                invited = true;
                console.log(`✅ Email sent: success=${emailResult.success}, messageId=${emailResult.messageId || 'N/A'}`);
            } catch (emailErr: unknown) {
                console.warn('⚠️ Email send failed (non-critical):', emailErr instanceof Error ? emailErr.message : emailErr);
            }
        } else {
            // Participant already in this deal, not a resend — skip email entirely
            console.log(`⏭️ Skipping email for ${email} — already linked to deal ${dealId} and not a resend`);
            invited = false;
        }

        // ── 9. Update invitation status ──────────────────────────
        if (invited) {
            await serviceClient
                .from('participants')
                .update({
                    invitation_status: isResend ? 'resent' : 'invited',
                    updated_at: new Date().toISOString()
                })
                .eq('id', participantId);

            message = isResend ? 'resent' : (wasAlreadyLinked ? 'already-linked' : 'invited');
        }

        // ── 10. Return success (ALWAYS) ──────────────────────────
        return NextResponse.json({
            success: true,
            participantId,
            authUserId,
            linked,
            invited,
            message,
            inviteLink: directLink
        });

    } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : 'Internal server error';
        console.error('❌ Participant invite error:', error);
        console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A');
        return NextResponse.json({ error: errMsg }, { status: 500 });
    }
}
