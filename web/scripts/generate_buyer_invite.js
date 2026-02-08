
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

async function generateBuyerInvite() {
    const email = 'buyer.test@agenzia.com';
    console.log(`Creating/Inviting Test Buyer: ${email}...`);

    // 1. Create User with Buyer Role
    const { data: user, error: createError } = await supabase.auth.admin.createUser({
        email: email,
        user_metadata: {
            role: 'buyer',
            full_name: 'Test Buyer',
            functional_role: 'buyer'
        },
        email_confirm: true // Auto-confirm so we can just log in or set password
    });

    if (createError) {
        console.log('User might already exist, proceeding to generate link...');
    } else {
        console.log('✅ User created.');
    }

    // 2. Generate Invite/Recovery Link (to set password)
    // using 'recovery' type because 'invite' might not work if user is auto-confirmed or if we want to force password set flow
    const { data, error } = await supabase.auth.admin.generateLink({
        type: 'recovery', // effectively allows setting password
        email: email,
        options: {
            redirectTo: 'http://localhost:3000/auth/update-password'
        }
    });

    if (error) {
        console.error('Error generating link:', error);
    } else {
        console.log('\n--- BUYER INVITE LINK ---');
        console.log(`User: ${email}`);
        console.log(`Role: Buyer`);
        const link = data.properties?.action_link;
        console.log(link);
        console.log('-------------------------\n');

        // Write to file for reliable retrieval
        const fs = require('fs');
        fs.writeFileSync('buyer_link.txt', link);
    }
}

generateBuyerInvite();
