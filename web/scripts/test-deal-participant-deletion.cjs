const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const crypto = require('crypto');
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    const email = 'test_staff_deal_deletion@agenzia.com';

    // 1. Create a dummy test staff user
    console.log("1. Creating test staff user...");
    const { data: createData } = await client.auth.admin.createUser({
        email,
        password: 'password123',
        email_confirm: true,
        user_metadata: { name: 'Test Deletion Staff', role: 'Staff', isInternal: true }
    });
    const userId = createData?.user?.id;
    if (!userId) {
        console.error("Failed to create user");
        return;
    }

    await client.from('users').insert({
        id: userId, email, name: 'Test Deletion Staff', role: 'Staff', is_active: true
    });

    // 2. Add them as a global participant
    console.log("2. Adding them as a global participant...");
    const participantId = crypto.randomUUID();
    await client.from('participants').insert({
        id: participantId, email, name: 'Test Deletion Staff - Global', phone: ''
    });

    // 3. Find a deal to link them to
    const { data: deals } = await client.from('deals').select('id').limit(1);
    const dealId = deals?.[0]?.id;
    if (dealId) {
        console.log("3. Linking them to a deal participant row...");
        await client.from('deal_participants').insert({
            deal_id: dealId, participant_id: participantId, role: 'Staff', permissions: {}
        });
    }

    // 4. Delete the staff user (simulating the UI endpoint)
    console.log("4. Simulating UI Deletion (Auth & Public Users)...");
    await client.auth.admin.deleteUser(userId);
    await client.from('users').delete().eq('id', userId);

    // 5. Verify their existence elsewhere
    console.log("5. Verification results post-deletion:");
    const { data: pCheck } = await client.from('participants').select('id').eq('email', email);
    console.log("   Exists in global participants table?", pCheck && pCheck.length > 0 ? "YES ✅" : "NO ❌");

    if (dealId) {
        const { data: dpCheck } = await client.from('deal_participants').select('participant_id').eq('participant_id', participantId);
        console.log("   Exists in deal_participants table for deal " + dealId + "?", dpCheck && dpCheck.length > 0 ? "YES ✅" : "NO ❌");
    }

    // Cleanup the participant data too
    console.log("6. Cleaning up test data...");
    await client.from('deal_participants').delete().eq('participant_id', participantId);
    await client.from('participants').delete().eq('email', email);
}

main().catch(console.error);
