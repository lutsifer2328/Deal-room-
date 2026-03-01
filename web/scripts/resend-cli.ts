import { Resend } from 'resend';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
    console.error('Error: RESEND_API_KEY is not set in .env.local');
    process.exit(1);
}

const resend = new Resend(apiKey);

async function main() {
    const command = process.argv[2];

    switch (command) {
        case 'domains': {
            console.log('Fetching domains...');
            const { data, error } = await resend.domains.list();
            if (error) {
                console.error('Failed to fetch domains:', error);
                process.exit(1);
            }
            console.log(JSON.stringify(data, null, 2));
            break;
        }

        case 'send': {
            const to = process.argv[3];
            const subject = process.argv[4];
            const text = process.argv[5];

            if (!to || !subject || !text) {
                console.error('Usage: tsx scripts/resend-cli.ts send <to> <subject> <text_content>');
                process.exit(1);
            }

            console.log(`Sending test email to ${to}...`);
            // When testing, you can only send to the same email address that you verified the domain with,
            // or to any address if you use the testing onboarding@resend.dev domain (which only sends to the account owner).
            const { data, error } = await resend.emails.send({
                from: 'onboarding@resend.dev',
                to,
                subject,
                text,
            });

            if (error) {
                console.error('Failed to send email:', error);
                process.exit(1);
            }
            console.log('Email sent successfully:', data);
            break;
        }

        default:
            console.log(`
Resend CLI Tool

Usage:
  npx tsx scripts/resend-cli.ts <command> [args...]

Commands:
  domains                             Fetch domain verification status
  send <to> <subject> <text_content>  Send a test email

Examples:
  npx tsx scripts/resend-cli.ts domains
  npx tsx scripts/resend-cli.ts send test@example.com "Test Subject" "Hello from Resend API"
      `);
            process.exit(1);
    }
}

main().catch(console.error);
