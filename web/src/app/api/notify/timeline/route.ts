import { NextResponse } from 'next/server';
import { sendTimelineNotificationEmail } from '@/lib/emailService';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
        }
        const token = authHeader.replace('Bearer ', '');

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

        // Verify caller
        const userClient = createClient(supabaseUrl, anonKey, {
            auth: { autoRefreshToken: false, persistSession: false },
            global: { headers: { Authorization: `Bearer ${token}` } }
        });

        const { data: { user: caller }, error: authError } = await userClient.auth.getUser();
        if (authError || !caller) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const body = await request.json();
        const { dealId, participantEmails } = body;

        // participantEmails should be an array of objects { email, name }
        if (!dealId || !participantEmails || !Array.isArray(participantEmails)) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dealroom.online';
        const actionLink = `${siteUrl}/deal/${dealId}`;

        const results = [];

        // Send emails to all relevant participants
        for (const p of participantEmails) {
            if (!p.email) continue;

            const result = await sendTimelineNotificationEmail(
                p.email,
                p.name || p.email.split('@')[0],
                actionLink
            );

            results.push({ email: p.email, success: result.success, error: result.error });
        }

        // Return overall success (even if some failed, we fulfilled the request)
        return NextResponse.json({ success: true, results });

    } catch (error: any) {
        console.error('Timeline notification error:', error);
        return NextResponse.json(
            { error: error?.message || 'Failed to send notification' },
            { status: 500 }
        );
    }
}
