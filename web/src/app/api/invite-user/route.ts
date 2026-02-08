import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { sendInviteEmail } from '@/lib/emailService';

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

            // B. Send Notification for New Deal Access
            if (dealId) {
                // Fetch deal title for email
                const { data: deal } = await supabaseAdmin.from('deals').select('title').eq('id', dealId).single();
                const dealTitle = deal?.title || 'New Deal';

                // Generate a magic link for easy access
                const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
                    type: 'magiclink',
                    email: email,
                    options: {
                        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/deal/${dealId}`
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
            }
        } else {
            // --- NEW USER ---

            // A. Create in Auth (without auto-invite)
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email,
                user_metadata: {
                    name: fullName,
                    role: isInternal ? 'staff' : 'user',
                    functional_role: role // 'broker', 'buyer', etc.
                },
                email_confirm: true // We will verify them via the magic link
            });

            if (authError) throw authError;
            userId = authData.user.id;

            // B. Create in Public Users (Sync)
            const { error: publicError } = await supabaseAdmin
                .from('users')
                .insert({
                    id: userId,
                    email,
                    name: fullName,
                    role: isInternal ? (role === 'admin' ? 'admin' : 'staff') : 'user',
                    is_active: true,
                    requires_password_change: true, // Force them to set password on first login
                    created_at: new Date().toISOString()
                });

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
                return NextResponse.json({ success: true, message: 'User already in deal' });
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
