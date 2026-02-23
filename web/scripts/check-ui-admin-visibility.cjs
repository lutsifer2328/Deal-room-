const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

async function main() {
    let out = "Checking new_ui_admin...\n";
    const anonClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    // We set the password a while ago for this user via the invite-user fix
    const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({
        email: 'new_ui_admin@agenzia.com',
        password: 'password123'
    });

    if (authError) {
        out += "Login Failed: " + authError.message + "\n";
        fs.writeFileSync('scripts/ui-admin-deals-utf8.out', out, 'utf8');
        return;
    }

    const adminUserId = authData.user.id;
    out += `✅ Logged in as new_ui_admin (${adminUserId})\n`;

    // Check deals
    const { data: adminDeals, error: adminDealsError } = await anonClient.from('deals').select('*');
    if (adminDealsError) out += "Admin Deals Error: " + adminDealsError.message + "\n";
    else out += `New UI Admin sees ${adminDeals.length} deals.\n`;

    fs.writeFileSync('scripts/ui-admin-deals-utf8.out', out, 'utf8');
}
main();
