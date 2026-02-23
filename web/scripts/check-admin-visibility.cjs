const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    console.log("Fetching RLS policies...");
    // We can't query pg_policies directly via standard API, but we can use RPC if one exists,
    // or we can test permissions directly by logging in as the new admin and querying the tables.

    // Actually, let's just log in as the new admin and see what we get returned, then see what the service role gets.
    const anonClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({
        email: 'brand_new_admin@agenzia.com',
        password: 'password123'
    });

    if (authError) {
        console.error("Login Failed:", authError.message);
        return;
    }

    const adminUserId = authData.user.id;
    console.log(`✅ Logged in as brand_new_admin (${adminUserId})`);

    // Check deals
    const { data: adminDeals, error: adminDealsError } = await anonClient.from('deals').select('*');
    if (adminDealsError) console.error("Admin Deals Error:", adminDealsError.message);
    else console.log(`New Admin sees ${adminDeals.length} deals.`);

    // Check documents
    const { data: adminDocs, error: adminDocsError } = await anonClient.from('documents').select('*');
    if (adminDocsError) console.error("Admin Docs Error:", adminDocsError.message);
    else console.log(`New Admin sees ${adminDocs.length} documents.`);

    // Check participants
    const { data: adminParticipants, error: adminPartsError } = await anonClient.from('participants').select('*');
    if (adminPartsError) console.error("Admin Participants Error:", adminPartsError.message);
    else console.log(`New Admin sees ${adminParticipants.length} participants.`);

    // --- Contrast with Service Role ---
    const { data: allDeals } = await client.from('deals').select('id, title');
    console.log(`\nService Role sees ${allDeals?.length} deals in total.`);

    // Let's also test as the OLD admin to see what they get
    const { data: oldAuthData, error: oldAuthError } = await anonClient.auth.signInWithPassword({
        email: 'test_admin@agenzia.com',
        password: 'password123' // assuming this is the password for the old test admin, but it might not be.
    });

    if (oldAuthError) {
        console.log("Could not login as old admin to compare (might need to force reset their password):", oldAuthError.message);
    } else {
        const { data: oldAdminDeals } = await anonClient.from('deals').select('*');
        console.log(`Old Admin sees ${oldAdminDeals?.length} deals.`);
    }
}
main();
