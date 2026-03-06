import { NextResponse } from 'next/server';
import { sendTaskNotificationEmail } from '@/lib/emailService';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        let userClient;

        // Try getting token from Auth Header first (for backward compatibility during rollout)
        const authHeader = request.headers.get('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.replace('Bearer ', '');
            userClient = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                {
                    global: { headers: { Authorization: `Bearer ${token}` } }
                }
            );
        } else {
            // Otherwise default to the modern SSR cookie approach
            userClient = createServerClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                {
                    cookies: {
                        getAll() {
                            return cookieStore.getAll();
                        },
                        setAll(cookiesToSet) {
                            try {
                                cookiesToSet.forEach(({ name, value, options }) => {
                                    cookieStore.set(name, value, options);
                                });
                            } catch (error) {
                                // The `set` method was called from a Server Component.
                                // This can be ignored if you have middleware refreshing user sessions.
                            }
                        },
                    },
                }
            );
        }

        const { data: { user: caller }, error: authError } = await userClient.auth.getUser();
        if (authError || !caller) {
            return NextResponse.json({ error: 'Invalid authentication token or cookie' }, { status: 401 });
        }

        const body = await request.json();
        const { dealId, participantEmail, participantName } = body;

        if (!dealId || !participantEmail) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dealroom.online';
        const actionLink = `${siteUrl}/deal/${dealId}`;

        // Send the email
        const result = await sendTaskNotificationEmail(
            participantEmail,
            participantName || participantEmail.split('@')[0],
            actionLink
        );

        if (!result.success) {
            console.error('Task notification email failed:', result.error);
            // We return 200 even if email fails so we don't break the main flow, 
            // but we include the error for debugging
            return NextResponse.json({ success: false, error: result.error });
        }

        return NextResponse.json({ success: true, messageId: result.messageId });

    } catch (error: any) {
        console.error('Task notification error:', error);
        return NextResponse.json(
            { error: error?.message || 'Failed to send notification' },
            { status: 500 }
        );
    }
}
