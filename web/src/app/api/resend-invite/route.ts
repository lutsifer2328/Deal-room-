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

        // 1. Ensure user exists and get their name
        const { data: userProfile } = await supabaseAdmin
            .from('users')
            .select('name, id, role')
            .eq('email', email)
            .maybeSingle();

        const name = userProfile?.name || email.split('@')[0];

        // 2. Generate raw recovery link
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'recovery',
            email,
            options: {
                redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`
            }
        });

        if (linkError || !linkData?.properties?.action_link) {
            console.error('Error generating recovery link:', linkError);
            throw linkError || new Error('Failed to generate recovery link');
        }

        // 3. Extract the token_hash to build a robust directLink to /auth/callback
        const supabaseActionLink = linkData.properties.action_link;
        const actionUrl = new URL(supabaseActionLink);
        const tokenHash = actionUrl.searchParams.get('token');
        const linkType = actionUrl.searchParams.get('type') || 'recovery';

        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        const directLink = `${siteUrl}/auth/callback?token_hash=${tokenHash}&type=${linkType}`;

        // 4. Send the new Elite HTML email via Resend
        const { sendInviteEmail } = await import('@/lib/emailService');
        const emailResult = await sendInviteEmail(
            email,
            name,
            directLink,
            userProfile?.role || 'user',
            undefined, // no deal title for a generic password reset
            false      // explicitly mark as generic invite/reset flow
        );

        if (!emailResult.success) {
            console.error('Error sending Resend email:', emailResult.error);
            throw new Error(emailResult.error || 'Failed to dispatch email');
        }

        console.log('✅ Password reset email resent successfully via Resend');

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
