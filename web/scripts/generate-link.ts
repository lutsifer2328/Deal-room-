import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { writeFileSync } from 'fs';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

if (!url || !key) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
    const email = process.argv[2] || 'tommy@imotco.bg';

    const { data, error } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: {
            redirectTo: `${siteUrl}/auth/callback`
        }
    });

    if (error) {
        writeFileSync('link_output.txt', `ERROR: ${error.message}`);
        process.exit(1);
    }

    // Extract token and build direct link (same logic as invite endpoint)
    const actionUrl = new URL(data.properties.action_link);
    const tokenHash = actionUrl.searchParams.get('token');
    const linkType = actionUrl.searchParams.get('type') || 'recovery';
    const directLink = `${siteUrl}/auth/callback?token_hash=${tokenHash}&type=${linkType}`;

    writeFileSync('link_output.txt', directLink);
    console.log('Link saved to link_output.txt');
}

main();
