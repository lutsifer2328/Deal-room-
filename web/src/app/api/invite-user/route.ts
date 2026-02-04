import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { generateSecurePassword } from '@/lib/generatePassword';
import { sendStaffInviteEmail, sendExternalInviteEmail } from '@/lib/emailService';

export async function POST(request: Request) {
    try {
        const { email, name, role, redirectTo } = await request.json();
        console.log('✅ API Route: Invite user started');
        console.log('📧 Request data:', { email, name, role });

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // 1. Determine User Type
        const internalRoles = ['admin', 'lawyer', 'staff'];
        const isInternal = internalRoles.includes(role);

        // Validation: Staff/Admin/Lawyer MUST be handled as internal
        // External roles: buyer, seller, agent, notary, bank_representative
        console.log(`👤 User Type: ${isInternal ? 'INTERNAL' : 'EXTERNAL'} (Role: ${role})`);

        // Setup Supabase Admin
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qolozennlzllvrqmibls.supabase.co';
        if (!process.env.SERVICE_ROLE_KEY) {
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }
        const supabaseAdmin = createClient(
            supabaseUrl,
            process.env.SERVICE_ROLE_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        let emailResult;
        let userData;

        if (isInternal) {
            // === INTERNAL FLOW (Credential-Based) ===
            const tempPassword = generateSecurePassword();
            console.log('🔐 Generated temporary password for Internal User');

            const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email: email,
                password: tempPassword,
                email_confirm: true,
                user_metadata: { name, role, requires_password_change: true } // FORCE PASSWORD CHANGE
            });

            if (createError) throw createError;
            userData = createdUser.user;

            // Send Internal Welcome Email
            console.log('📧 Sending Internal Welcome Email...');
            emailResult = await sendStaffInviteEmail(email, name, email, tempPassword, role);

        } else {
            // === EXTERNAL FLOW (Token-Based) ===
            console.log('🔗 Generating Access Link for External User');

            // 1. Create User (if not exists) without password, unconfirmed
            // Use generating link of type 'invite' usually requires user to exist? 
            // Actually 'inviteUserByEmail' sends the email. We want 'generateLink' to get the URL and send custom email.
            // So first, create the user.
            const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email: email,
                email_confirm: true, // We will trust the link delivery as confirmation
                user_metadata: { name, role, requires_password_change: false }
            });

            // If user exists, that's fine, we'll just generate a link
            if (createError && !(createError as any).code?.includes('unique') && !createError.message?.includes('exists')) {
                throw createError;
            }

            // 2. Generate Invite Link
            const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
                type: 'invite',
                email: email,
                options: {
                    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/setup-password` // Redirect to password set page
                }
            });

            if (linkError) throw linkError;

            const actionLink = linkData.properties.action_link;
            userData = linkData.user;

            // 3. Send External Invite Email
            console.log('📧 Sending External Invite Email with Link...');
            emailResult = await sendExternalInviteEmail(email, actionLink, role);
            console.log('--> ACTION LINK Generated & Sent:', actionLink);
        }

        // Update public users table
        if (userData) {
            await supabaseAdmin.from('users').upsert({
                id: userData.id,
                email: email,
                name: name,
                role: role,
                is_active: true,
                requires_password_change: isInternal // Sync this flag to public table too
            });

            // Link participant
            await supabaseAdmin.from('participants').update({ user_id: userData.id }).eq('email', email);
        }

        return NextResponse.json({
            success: true,
            user: userData,
            emailSent: emailResult.success,
            isInternal
        });

    } catch (error: any) {
        console.error('❌ Invite error:', error);
        return NextResponse.json({ error: error.message || 'Failed to invite' }, { status: 500 });
    }
}
