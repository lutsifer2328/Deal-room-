import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        console.log('🔄 Resending invitation to:', email);

        // Create admin client
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

        // Send password recovery email (works for invited users too)
        const { data, error } = await supabaseAdmin.auth.resetPasswordForEmail(
            email,
            {
                redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`
            }
        );

        if (error) {
            console.error('Error resending invitation:', error);
            throw error;
        }

        console.log('✅ Invitation resent successfully');

        return NextResponse.json({
            success: true,
            message: 'Password reset email sent'
        });

    } catch (error: any) {
        console.error('Resend error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to resend invitation' },
            { status: 500 }
        );
    }
}
