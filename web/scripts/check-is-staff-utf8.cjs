const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const anonClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function main() {
    let out = "Testing is_staff()...\n";
    const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({
        email: 'brand_new_admin@agenzia.com',
        password: 'password123'
    });

    if (authError) {
        out += "Login Failed: " + authError.message + "\n";
        fs.writeFileSync('scripts/check-is-staff-utf8.out', out);
        return;
    }

    out += `✅ Logged in as brand_new_admin\n`;

    const { data: isStaff, error: isStaffError } = await anonClient.rpc('is_staff');
    if (isStaffError) {
        out += "RPC Error (is_staff): " + isStaffError.message + "\n";
    } else {
        out += "is_staff() returns: " + isStaff + "\n";
    }

    const { data: me, error: meError } = await anonClient.from('users').select('*').eq('id', authData.user.id).single();
    if (meError) {
        out += "Read Self Users Error: " + meError.message + "\n";
    } else {
        out += "Read Self from public.users: " + JSON.stringify(me, null, 2) + "\n";
    }
    fs.writeFileSync('scripts/check-is-staff-utf8.out', out, 'utf8');
}
main();
