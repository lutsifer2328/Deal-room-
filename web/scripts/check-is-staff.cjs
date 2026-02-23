const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const anonClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function main() {
    console.log("Testing is_staff()...");
    const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({
        email: 'brand_new_admin@agenzia.com',
        password: 'password123'
    });

    if (authError) {
        console.error("Login Failed:", authError.message);
        return;
    }

    console.log(`✅ Logged in as brand_new_admin`);

    const { data: isStaff, error: isStaffError } = await anonClient.rpc('is_staff');
    if (isStaffError) {
        console.error("RPC Error (is_staff):", isStaffError.message);
    } else {
        console.log("is_staff() returns:", isStaff);
    }

    const { data: me, error: meError } = await anonClient.from('users').select('*').eq('id', authData.user.id).single();
    if (meError) {
        console.error("Read Self Users Error:", meError.message);
    } else {
        console.log("Read Self from public.users:", me);
    }
}
main();
