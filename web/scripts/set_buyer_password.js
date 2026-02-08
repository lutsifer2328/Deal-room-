
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

async function setBuyerPassword() {
    const email = 'buyer.test@agenzia.com';
    const newPassword = 'buyer123';

    console.log(`Setting password for ${email} to '${newPassword}'...`);

    // 1. Get User ID (optional, but good for verification)
    // Actually admin.updateUser takes ID, not email. We need to find the user first.
    // Or we can use admin.createUser with upsert? No.
    // We can list users.

    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    // Simple find
    const user = users.find(u => u.email === email);

    if (!user) {
        console.error('❌ Buyer user not found! Did the previous script run?');
        return;
    }

    // 2. Update Password
    const { data, error } = await supabase.auth.admin.updateUserById(
        user.id,
        { password: newPassword }
    );

    if (error) {
        console.error('❌ Error setting password:', error);
    } else {
        console.log('✅ Password set successfully.');
        console.log(`Email: ${email}`);
        console.log(`Password: ${newPassword}`);
    }
}

setBuyerPassword();
