
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function generateLink() {
    const email = 'lutsifer@gmail.com';
    console.log(`Generating reset link for ${email}...`);

    const { data, error } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: email,
        options: {
            redirectTo: 'http://localhost:3000/auth/update-password'
        }
    });

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('\n--- PASSWORD RECOVERY LINK ---');
        console.log(data.properties?.action_link);
        console.log('------------------------------\n');
    }
}

generateLink();
