const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const anonClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function main() {
    const email = 'brand_new_admin@agenzia.com';
    const pwd = 'password123';

    console.log("1. Cleaning up any previous runs...");
    const { data: list } = await client.auth.admin.listUsers();
    const existing = list.users.find(u => u.email === email);
    if (existing) {
        await client.auth.admin.deleteUser(existing.id);
        await client.from('users').delete().eq('email', email);
    }

    console.log("2. Direct Service Role Creation (Simulating API)...");
    const { data: authData, error: authError } = await client.auth.admin.createUser({
        email,
        password: pwd,
        user_metadata: { name: 'Brand New', role: 'admin' },
        email_confirm: true
    });

    if (authError) { console.error("Create Auth Err:", authError); return; }

    await client.from('users').upsert({
        id: authData.user.id,
        email,
        name: 'Brand New',
        role: 'admin',
        is_active: true
    });

    console.log("3. Attempting Login...");
    const { data, error } = await anonClient.auth.signInWithPassword({
        email,
        password: pwd
    });

    if (error) {
        console.error("❌ Login Failed:", error.message);
    } else {
        console.log("✅ Login Succeeded!");
        console.log("Role Metadata:", data.user.user_metadata.role);
    }
}
main();
