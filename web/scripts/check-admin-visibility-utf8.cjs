const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    let out = "Fetching RLS policies...\n";
    const anonClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({
        email: 'brand_new_admin@agenzia.com',
        password: 'password123'
    });

    if (authError) {
        out += "Login Failed: " + authError.message + "\n";
        fs.writeFileSync('scripts/admin-deals-utf8.out', out, 'utf8');
        return;
    }

    const adminUserId = authData.user.id;
    out += `✅ Logged in as brand_new_admin (${adminUserId})\n`;

    // Check deals
    const { data: adminDeals, error: adminDealsError } = await anonClient.from('deals').select('*');
    if (adminDealsError) out += "Admin Deals Error: " + adminDealsError.message + "\n";
    else out += `New Admin sees ${adminDeals.length} deals.\n`;

    // Check documents
    const { data: adminDocs, error: adminDocsError } = await anonClient.from('documents').select('*');
    if (adminDocsError) out += "Admin Docs Error: " + adminDocsError.message + "\n";
    else out += `New Admin sees ${adminDocs.length} documents.\n`;

    // Check participants
    const { data: adminParticipants, error: adminPartsError } = await anonClient.from('participants').select('*');
    if (adminPartsError) out += "Admin Participants Error: " + adminPartsError.message + "\n";
    else out += `New Admin sees ${adminParticipants.length} participants.\n`;

    // --- Contrast with Service Role ---
    const { data: allDeals } = await client.from('deals').select('id, title');
    out += `\nService Role sees ${allDeals?.length} deals in total.\n`;

    fs.writeFileSync('scripts/admin-deals-utf8.out', out, 'utf8');
}
main();
