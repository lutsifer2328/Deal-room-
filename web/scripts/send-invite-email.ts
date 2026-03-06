import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load env FIRST
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

// THEN import resend (or just use it directly)
import { Resend } from 'resend';
import { getEliteEmailHtml } from '../src/lib/emailService';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const resendApiKey = process.env.RESEND_API_KEY;

if (!url || !key || !resendApiKey) {
    console.error('Missing configuration variables in .env.local');
    process.exit(1);
}

const supabase = createClient(url, key);
const resend = new Resend(resendApiKey);

async function main() {
    const email = process.argv[2] || 'tignatov@agenzia.bg';

    console.log(`Generating magic link for: ${email}`);

    // Fetch user details for the email context
    const { data: user } = await supabase.from('users').select('name, role').eq('email', email).single();
    if (!user) {
        console.error(`User ${email} not found in public.users`);
        process.exit(1);
    }

    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: {
            redirectTo: `${siteUrl}/dashboard`
        }
    });

    if (linkError) {
        console.error('Failed to generate magic link:', linkError.message);
        process.exit(1);
    }

    const actionLink = linkData.properties?.action_link;

    if (!actionLink) {
        console.error('No action_link returned from Supabase');
        process.exit(1);
    }

    console.log(`Sending email to ${email} via Resend...`);

    try {
        const { data, error } = await resend.emails.send({
            from: 'Agenzia Deal Room <notify@dealroom.online>',
            to: [email],
            subject: 'Welcome to Agenzia Deal Room',
            html: getEliteEmailHtml({
                name: user.name || 'User',
                actionLink: actionLink,
            })
        });

        if (error) {
            console.error('❌ Resend API Error:', error);
            process.exit(1);
        }

        console.log(`✅ Email sent successfully! ID: ${data?.id}`);
    } catch (err) {
        console.error('❌ Caught Exception:', err);
        process.exit(1);
    }
}

main();
