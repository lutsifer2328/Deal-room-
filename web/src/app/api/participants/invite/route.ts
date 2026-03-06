import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { sendInviteEmail } from '@/lib/emailService';

/**
 * POST /api/participants/invite
 * 
 * Idempotent participant invite endpoint.
 * Never throws "User already in deal". Always returns 200 on valid input.
 * 
 * Steps:
 * 1. Staff auth check
 * 2. Ensure participants row exists
 * 3. Ensure deal_participants link exists
 * 4. Ensure auth.users account (via inviteUserByEmail or lookup)
 * 5. Link participants.user_id → auth.users.id
 * 6. Ensure public.users row exists
 * 7. Send invite email
 * 8. Update invitation_status
 */
import { rateLimit } from '@/lib/limiter';

export async function POST(request: Request) {
    try {
        // ── 0. Setup clients ─────────────────────────────────────
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
        }
        const token = authHeader.replace('Bearer ', '');

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY!;

        if (!serviceRoleKey) {
            return NextResponse.json({ error: 'Server misconfigured: missing service role key' }, { status: 500 });
        }

        // userClient: validates caller identity via JWT
        const userClient = createClient(supabaseUrl, anonKey, {
            auth: { autoRefreshToken: false, persistSession: false },
            global: { headers: { Authorization: `Bearer ${token}` } }
        });

        // serviceClient: bypasses RLS for admin operations
        const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        // ── 1. Verify caller JWT and staff role ──────────────────
        const { data: { user: caller }, error: authError } = await userClient.auth.getUser();
        if (authError || !caller) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        // Check caller is active staff via service client (bypasses RLS)
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
        const { dealId, participantRole, name, resend: isResend } = body;
        const email = body.email?.toLowerCase()?.trim();

        if (!email) {
            return NextResponse.json({ error: 'Missing required field: email' }, { status: 400 });
        }

        // ── 1.5 Rate Limiting ────────────────────────────────────
        // Limit: 5 invites to the same email by the same user per 10 minutes
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
        let invited = false;

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
            // Create new participant
            participantId = crypto.randomUUID();
            const { error: createErr } = await serviceClient
                .from('participants')
                .insert({
                    id: participantId,
                    email,
                    name: name || email.split('@')[0],
                    invitation_status: 'pending',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });

            if (createErr) {
                // Race condition: another request created it first
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

        if (existingLink) {
            message = 'already-linked';
            console.log(`✅ Deal-participant link already exists`);
        } else {
            // Create new link — NEVER fail on duplicates (unique constraint on deal_id+participant_id)
            const { error: linkErr } = await serviceClient
                .from('deal_participants')
                .insert({
                    id: crypto.randomUUID(),
                    deal_id: dealId,
                    participant_id: participantId,
                    role: participantRole || 'buyer',
                    joined_at: new Date().toISOString()
                });

            if (linkErr && linkErr.code !== '23505') {
                console.error('Failed to create deal_participants link:', linkErr);
                throw linkErr;
            }
            message = 'linked';
            console.log(`✅ Created deal-participant link`);
        }

        // ── 5. Ensure auth.users account ─────────────────────────
        // CHECK FIRST, then create. Never blindly call inviteUserByEmail.
        let authUserId: string | null = null;
        let isNewUser = false;

        // 5a. Check if user already exists in public.users
        const { data: existingPublicUser } = await serviceClient
            .from('users')
            .select('id')
            .eq('email', email)
            .maybeSingle();

        if (existingPublicUser) {
            // User already in public.users → they have an auth account
            authUserId = existingPublicUser.id;
            console.log(`✅ Existing user found in public.users: ${authUserId}`);
        } else {
            // 5b. Not in public.users — try to create in auth.users
            // If user exists in auth but not public (orphaned), createUser will 422 and we handle it
            const { data: createData, error: createError } = await serviceClient.auth.admin.createUser({
                email,
                email_confirm: true,
                password: crypto.randomUUID(), // temporary password, user will set via recovery link
                user_metadata: {
                    name: name || email.split('@')[0],
                    role: 'viewer'
                }
            });

            if (createError) {
                if (createError.message?.includes('already been registered') || createError.status === 422) {
                    // User exists in auth but not in public.users (orphaned)
                    // Find them by listing all users
                    console.log(`ℹ️ Auth user exists but not in public.users. Searching...`);
                    const { data: allUsersData } = await serviceClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
                    const foundUser = allUsersData?.users?.find(u => u.email?.toLowerCase() === email);
                    if (foundUser) {
                        authUserId = foundUser.id;
                        console.log(`✅ Found orphaned auth user: ${authUserId}`);
                    } else {
                        console.error('❌ User reported as existing but not found in listUsers');
                    }
                } else {
                    throw createError;
                }
            } else {
                // Brand new user created successfully
                authUserId = createData.user.id;
                isNewUser = true;
                console.log(`✅ Created new auth user: ${authUserId}`);
            }
        }

        // ── 6. Ensure public.users row ───────────────────────────
        // For NEW users: insert the row. For existing: do nothing (don't overwrite role/name).
        if (authUserId && isNewUser) {
            const { error: insertErr } = await serviceClient
                .from('users')
                .upsert({
                    id: authUserId,
                    email,
                    name: name || email.split('@')[0],
                    role: 'viewer',
                    is_active: true,
                    created_at: new Date().toISOString()
                }, {
                    onConflict: 'id',
                    ignoreDuplicates: true  // Don't overwrite existing user data
                });

            if (insertErr) {
                console.warn('⚠️ public.users insert warning:', insertErr.message);
            } else {
                console.log(`✅ public.users row ensured for new user: ${authUserId}`);
            }
        } else if (authUserId) {
            // Existing user: just ensure is_active = true
            await serviceClient
                .from('users')
                .update({ is_active: true })
                .eq('id', authUserId);
            console.log(`✅ Existing user reactivated: ${authUserId}`);
        }

        // ── 7. Link participants.user_id ─────────────────────────
        const linked = !!authUserId;
        if (authUserId) {
            // Only update if not already linked or linked to a different user
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

        // ── 8. Send invite/recovery email ────────────────────────
        // For NEW users: send welcome + set-password link
        // For EXISTING users: send "you have new deal access" + login link
        let directLink: string | null = null;
        if (!invited || isResend) {
            try {
                // Get deal title for email
                const { data: deal } = await serviceClient
                    .from('deals')
                    .select('title')
                    .eq('id', dealId)
                    .single();
                const dealTitle = deal?.title || 'Agenzia Deal Room';

                // Generate a recovery link so user can set password
                const { data: linkData, error: linkError } = await serviceClient.auth.admin.generateLink({
                    type: 'recovery',
                    email,
                    options: {
                        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://dealroom.online'}/auth/callback`
                    }
                });

                if (!linkError && linkData?.properties?.action_link) {
                    const supabaseActionLink = linkData.properties.action_link;

                    // Extract raw token from Supabase's action_link to bypass PKCE redirect
                    // action_link: https://xxx.supabase.co/auth/v1/verify?token=TOKEN&type=recovery&redirect_to=...
                    const actionUrl = new URL(supabaseActionLink);
                    const tokenHash = actionUrl.searchParams.get('token');
                    const linkType = actionUrl.searchParams.get('type') || 'recovery';

                    // Build DIRECT callback URL (bypasses Supabase's server-side redirect + PKCE)
                    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dealroom.online';
                    directLink = `${siteUrl}/auth/callback?token_hash=${tokenHash}&type=${linkType}`;

                    // Log for immediate terminal testing
                    console.log('\n══════════════════════════════════════════════════════');
                    console.log('🔗 DIRECT LOGIN LINK FOR:', email);
                    console.log('══════════════════════════════════════════════════════');
                    console.log(directLink);
                    console.log('══════════════════════════════════════════════════════\n');

                    const isExisting = !isNewUser || message === 'already-linked' || !!existingParticipant?.user_id;

                    // Send email with the DIRECT link (not Supabase's redirect link)
                    const emailResult = await sendInviteEmail(email, name || email, directLink, participantRole || 'participant', dealTitle, isExisting);
                    invited = true;
                    console.log(`✅ Email dispatch result: success=${emailResult.success}, messageId=${emailResult.messageId || 'N/A'}`);
                } else if (linkError) {
                    console.warn('⚠️ generateLink failed:', linkError.message);
                }
            } catch (emailErr: unknown) {
                console.warn('⚠️ Email send failed (non-critical):', emailErr instanceof Error ? emailErr.message : emailErr);
                // Don't fail the request — participant is still linked
            }
        }

        // Update invitation status
        if (invited) {
            await serviceClient
                .from('participants')
                .update({
                    invitation_status: isResend ? 'resent' : 'invited',
                    updated_at: new Date().toISOString()
                })
                .eq('id', participantId);

            message = isResend ? 'resent' : (message === 'already-linked' ? 'already-linked' : 'invited');
        }

        // ── 9. Return success (ALWAYS) ───────────────────────────
        return NextResponse.json({
            success: true,
            participantId,
            authUserId,
            linked,
            invited,
            message,
            inviteLink: directLink // Always include so client can show "Copy Link" fallback
        });

    } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : 'Internal server error';
        console.error('❌ Participant invite error:', error);
        console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A');
        console.error('Full Error Object:', JSON.stringify(error, null, 2));
        return NextResponse.json(
            { error: errMsg },
            { status: 500 }
        );
    }
}
