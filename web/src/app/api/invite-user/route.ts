import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { sendInviteEmail } from '@/lib/emailService';
import { rateLimit } from '@/lib/limiter';

export async function POST(request: Request) {
    try {
        const {
            dealId,
            email,
            fullName,
            role,
            agency,
            isInternal,
            canViewDocuments,
            canDownload,
            documentPermissions
        } = await request.json();

        const cleanEmail = email?.trim();
        const cleanName = fullName?.trim();

        if (!cleanEmail) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY!;

        const supabaseAdmin = createClient(
            supabaseUrl,
            serviceRoleKey,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        // --- Rate Limiting Strategy ---
        // We use the caller IP if available, otherwise a global fallback for the invite route.
        // In Next.js App Router, extracting IP robustly can sometimes require headers().
        // For simplicity and security, we'll limit by 'invite-user' globally or by specific email attempt.
        const reqIp = request.headers.get('x-forwarded-for') || 'unknown-ip';
        const rateKey = `invite-user:${reqIp}`;
        const { ok, remaining } = await rateLimit(rateKey, 10, 600); // 10 requests per 10 minutes (600s)

        if (!ok) {
            console.warn(`[RATE LIMIT] Too many invites from ${reqIp}`);
            return NextResponse.json({ error: 'Rate limit exceeded. Please wait before inviting more users.' }, { status: 429 });
        }

        // 1. Check if user exists in public.users
        const { data: existingUser } = await supabaseAdmin
            .from('users')
            .select('id, is_active, name')
            .eq('email', email)
            .single();

        let userId = existingUser?.id;

        // 2. LOGIC BRANCH: New vs Existing
        if (existingUser) {
            // --- EXISTING USER ---

            // A. Reactivate if soft-deleted
            if (!existingUser.is_active) {
                await supabaseAdmin
                    .from('users')
                    .update({ is_active: true })
                    .eq('id', userId);
            }

            // B. Promote role if this is an internal/staff addition
            if (isInternal && role && ['admin', 'lawyer', 'staff'].includes(role)) {
                await supabaseAdmin
                    .from('users')
                    .update({ role, name: cleanName || existingUser.name })
                    .eq('id', userId);
                console.log(`✅ Promoted existing user ${email} to role: ${role}`);
            }

            // C. Send Notification for New Deal Access or General Access
            let dealTitle = 'Agenzia Deal Room';
            let redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard`;

            if (dealId) {
                const { data: deal } = await supabaseAdmin.from('deals').select('title').eq('id', dealId).single();
                if (deal) dealTitle = deal.title;
                redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/deal/${dealId}`;
            }

            // Generate a magic link for easy access
            const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
                type: 'magiclink',
                email: email,
                options: {
                    redirectTo: redirectTo
                }
            });

            const actionLink = linkData?.properties?.action_link;

            if (actionLink) {
                await sendInviteEmail(
                    email,
                    existingUser.name || fullName || 'User',
                    actionLink,
                    role,
                    dealTitle,
                    true // isExistingUser = true
                );
            }
        } else {
            // --- NEW USER ---

            // A. Create in Auth (without auto-invite)
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password: 'password123', // <-- ADDED: Default password for new organizational users
                user_metadata: {
                    name: fullName,
                    role: isInternal ? (['admin', 'lawyer', 'staff'].includes(role) ? role : 'staff') : 'user',
                    functional_role: role // 'broker', 'buyer', etc.
                },
                email_confirm: true // We will verify them via the magic link
            });

            if (authError) {
                // If the user already exists in Auth but was missing from public.users (Sync Issue)
                if (authError.message.includes('already exists') || authError.status === 422) {
                    console.log(`User ${email} already exists in Auth, recovering ID...`);
                    // We can't use getUserByEmail directly without fetching all or using a workaround, 
                    // but listUsers with a search works, or we can just try to update their auth metadata
                    // The easiest reliable way is listUsers
                    const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
                    const existingAuthUser = listData.users.find(u => u.email === email);

                    if (existingAuthUser) {
                        userId = existingAuthUser.id;

                        // Ensure metadata is up to date
                        await supabaseAdmin.auth.admin.updateUserById(userId, {
                            user_metadata: {
                                name: fullName,
                                role: isInternal ? 'staff' : 'user',
                                functional_role: role
                            }
                        });
                    } else {
                        throw authError; // Really failed
                    }
                } else {
                    throw authError; // Other error
                }
            } else {
                userId = authData.user.id;
            }

            // B. Create/Update in Public Users (Sync)
            const { error: publicError } = await supabaseAdmin
                .from('users')
                .upsert({
                    id: userId,
                    email,
                    name: fullName,
                    role: isInternal ? (['admin', 'lawyer', 'staff'].includes(role) ? role : 'staff') : 'user',
                    is_active: true,
                    requires_password_change: true, // Force them to set password on first login
                    created_at: new Date().toISOString()
                }, { onConflict: 'id' });

            if (publicError) {
                console.error('Failed to create public user record:', publicError);
                // Continue though, as critical auth record exists
            }

            // C. Generate Magic Link (Recovery Type -> Update Password Page)
            const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
                type: 'recovery',
                email: email,
                options: {
                    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/update-password`
                }
            });

            if (linkError) {
                console.error('Failed to generate invite link:', linkError);
                // Notification will fail, but user exists
            } else {
                // D. Send Email via Resend
                const actionLink = linkData.properties?.action_link;

                // Fetch deal title if we have access to it
                let dealTitle = 'Agenzia Deal Room';
                if (dealId) {
                    const { data: deal } = await supabaseAdmin.from('deals').select('title').eq('id', dealId).single();
                    if (deal) dealTitle = deal.title;
                }

                if (actionLink) {
                    await sendInviteEmail(
                        email,
                        fullName,
                        actionLink,
                        role,
                        dealTitle,
                        false // isExistingUser = false
                    );
                }
            }
        }
        // 2.5 Promote user in existing deals if they were granted an internal role
        if (isInternal && userId && role) {
            // Find global participant
            const { data: globalParticipants } = await supabaseAdmin
                .from('participants')
                .select('id, user_id')
                .eq('email', email);

            const globalParticipant = globalParticipants && globalParticipants.length > 0 ? globalParticipants[0] : null;

            if (globalParticipant) {
                // Link userId if missing
                if (!globalParticipant.user_id) {
                    await supabaseAdmin.from('participants').update({ user_id: userId }).eq('id', globalParticipant.id);
                }

                // Get their existing deal participations
                const { data: existingDealLinks } = await supabaseAdmin
                    .from('deal_participants')
                    .select('id, role')
                    .eq('participant_id', globalParticipant.id);

                if (existingDealLinks && existingDealLinks.length > 0) {
                    // Define role weights to ensure we only promote
                    const roleWeight: Record<string, number> = {
                        admin: 100,
                        lawyer: 90,
                        staff: 80,
                        broker: 70,
                        agent: 50,
                        buyer: 10,
                        seller: 10,
                        viewer: 0
                    };

                    const targetWeight = roleWeight[role] || 0;

                    for (const link of existingDealLinks) {
                        const currentWeight = roleWeight[link.role] || 0;
                        if (targetWeight > currentWeight) {
                            await supabaseAdmin
                                .from('deal_participants')
                                .update({ role: role })
                                .eq('id', link.id);
                            console.log(`Promoted user ${email} in deal_participant ${link.id} from ${link.role} to ${role}`);
                        }
                    }
                }
            }
        }

        // 3. Add to Deal Participants (ONLY IF dealId IS PROVIDED)
        if (dealId) {
            // A. Ensure Global Participant Exists
            // We search by email first because unique constraint is usually on email
            let participantId: string;

            const { data: globalParticipants } = await supabaseAdmin
                .from('participants')
                .select('id, user_id')
                .eq('email', email);

            const globalParticipant = globalParticipants && globalParticipants.length > 0 ? globalParticipants[0] : null;

            if (globalParticipant) {
                participantId = globalParticipant.id;
                // Optional: Update name if provided?
            } else {
                // Create new Global Participant
                participantId = crypto.randomUUID();
                const { error: createError } = await supabaseAdmin
                    .from('participants')
                    .insert({
                        id: participantId,
                        email: email,
                        name: fullName,
                        user_id: userId, // Link to auth user if they exist
                        agency: agency || '',
                        created_at: new Date().toISOString()
                    });

                if (createError) {
                    // Handle race condition if created between select and insert
                    if (createError.code === '23505') {
                        const { data: retryGP } = await supabaseAdmin.from('participants').select('id').eq('email', email).single();
                        if (retryGP) participantId = retryGP.id;
                        else throw createError;
                    } else {
                        throw createError;
                    }
                }
            }

            // B. Update Global Participant with User ID if it was missing (Link logic)
            if (userId && !globalParticipant?.user_id) {
                await supabaseAdmin.from('participants').update({ user_id: userId }).eq('id', participantId);
            }

            // C. Check if already linked to deal (in deal_participants)
            const { data: existingLink } = await supabaseAdmin
                .from('deal_participants')
                .select('id')
                .eq('deal_id', dealId)
                .eq('participant_id', participantId)
                .single();

            if (existingLink) {
                return NextResponse.json(
                    { error: 'User already in deal', success: false },
                    { status: 409 }
                );
            }

            // D. Create Link
            const { error: linkError } = await supabaseAdmin
                .from('deal_participants')
                .insert({
                    id: crypto.randomUUID(),
                    deal_id: dealId,
                    participant_id: participantId,
                    role: role,
                    permissions: {
                        canViewDocuments: canViewDocuments ?? false,
                        canDownloadDocuments: canDownload ?? false,
                        ...documentPermissions
                    },
                    is_active: true,
                    joined_at: new Date().toISOString()
                });

            if (linkError) {
                console.error('Failed to link participant:', linkError);
                throw linkError;
            }
        } // End if (dealId)



        return NextResponse.json({
            success: true,
            userId,
            isNewUser: !existingUser
        });

    } catch (error: any) {
        console.error('Invite user error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to invite user' },
            { status: 500 }
        );
    }
}
