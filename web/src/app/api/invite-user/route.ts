import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        console.log('🔧 API Route: Invite user started');
        const { email, name, role, redirectTo } = await request.json();
        console.log('🔧 Request data:', { email, name, role, redirectTo });

        if (!email) {
            console.error('❌ No email provided');
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        console.log('🔧 Creating admin client...');
        console.log('🔧 SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING');
        console.log('🔧 SERVICE_ROLE_KEY:', process.env.SERVICE_ROLE_KEY ? 'SET' : 'MISSING');

        // Create admin client with service role key
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        console.log('🔧 Calling inviteUserByEmail...');

        // Invite user
        const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
            email,
            {
                data: { name, role },
                redirectTo: redirectTo || `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`
            }
        );

        console.log('🔧 Invite result:', {
            success: !inviteError,
            userId: inviteData?.user?.id,
            error: inviteError?.message
        });

        if (inviteError) {
            console.error('❌ Supabase invite error:', inviteError);
            console.error('❌ Error details:', JSON.stringify(inviteError, null, 2));

            // Check if user already exists
            if (inviteError.message?.includes('already been registered') ||
                inviteError.message?.includes('already exists')) {
                return NextResponse.json({
                    message: 'User already has access to the system',
                    alreadyExists: true
                });
            }
            throw inviteError;
        }

        // Update public users table
        const { error: updateError } = await supabaseAdmin
            .from('users')
            .upsert({
                id: inviteData.user.id,
                email: email,
                name: name,
                role: role || 'viewer',
                is_active: true
            });

        if (updateError) {
            console.error('Error updating users table:', updateError);
            // Don't fail the whole operation if this fails
        }

        return NextResponse.json({
            success: true,
            user: inviteData.user
        });

    } catch (error: any) {
        console.error('Invite error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to send invitation' },
            { status: 500 }
        );
    }
}
