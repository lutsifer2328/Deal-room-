import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/limiter';

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

        // --- Rate Limiting (5 attempts per 10 minutes per email to prevent spam) ---
        const rateKey = `resend:${email.toLowerCase()}`;
        const { ok } = await rateLimit(rateKey, 5, 600);

        if (!ok) {
            console.warn(`[RATE LIMIT] Too many password resets requested for ${email}`);
            return NextResponse.json({ error: 'Too many requests. Please wait before trying again.' }, { status: 429 });
        }

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
