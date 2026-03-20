import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = 'https://qolozennlzllvrqmibls.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbG96ZW5ubHpsbHZycW1pYmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg1MTUyNywiZXhwIjoyMDg1NDI3NTI3fQ.3M6fxzDB9YfEFsLtxkdwNbojSHpGdgMhaCdAqIxVkSw';

// Service client ONLY for setup (fetching user ID), NOT for actions being tested
const serviceClient = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

// Helper to create role-based clients
const createRoleClient = async (email: string, password: string) => {
    const client = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw new Error(`Login failed for ${email}: ${error.message}`);
    return { client, user: data.user };
};

async function ensureUser(email: string, role: string) {
    console.log(`Ensuring user ${email} exists with role ${role}...`);
    const { data: authUser } = await serviceClient.auth.admin.listUsers();
    let user = authUser.users.find(u => u.email === email);

    if (!user) {
        const { data: newData, error } = await serviceClient.auth.admin.createUser({
            email,
            password: 'Password123!',
            email_confirm: true
        });
        if (error) throw error;
        user = newData.user;
        console.log(`Created auth user: ${user.id}`);
    } else {
        await serviceClient.auth.admin.updateUserById(user.id, { password: 'Password123!' });
        console.log(`Updated auth user password: ${user.id}`);
    }

    await serviceClient.from('users').upsert({
        id: user.id,
        email,
        role,
        is_active: true
    });
    return user;
}

async function main() {
    console.log('🚀 Starting SECURITY REGRESSION TESTS...');

    try {
        const adminUser = await ensureUser('admin_test@agency.com', 'admin');
        const lawyerUser = await ensureUser('lawyer_test@agency.com', 'lawyer');
        const buyerUser = await ensureUser('buyer_test@agency.com', 'user');
        const sellerUser = await ensureUser('seller_test@agency.com', 'user');

        const { client: adminClient } = await createRoleClient('admin_test@agency.com', 'Password123!');
        const { client: lawyerClient } = await createRoleClient('lawyer_test@agency.com', 'Password123!');
        const { client: buyerClient } = await createRoleClient('buyer_test@agency.com', 'Password123!');
        const { client: sellerClient } = await createRoleClient('seller_test@agency.com', 'Password123!');

        // 1. Create a Deal as Admin
        const dealId = crypto.randomUUID();
        await adminClient.from('deals').insert({ id: dealId, title: 'Isolation Test Deal', created_by: adminUser.id });
        console.log('✅ Created Deal');

        // 2. Add Participants
        const buyerPartId = crypto.randomUUID();
        const sellerPartId = crypto.randomUUID();

        await adminClient.from('participants').insert([
            { id: buyerPartId, user_id: buyerUser.id, email: buyerUser.email, name: 'Test Buyer' },
            { id: sellerPartId, user_id: sellerUser.id, email: sellerUser.email, name: 'Test Seller' }
        ]);

        await adminClient.from('deal_participants').insert([
            { deal_id: dealId, participant_id: buyerPartId, role: 'buyer' },
            { deal_id: dealId, participant_id: sellerPartId, role: 'seller' }
        ]);
        console.log('✅ Added Participants to Deal');

        // 3. Create Tasks
        const buyerTaskId = crypto.randomUUID();
        const sellerTaskId = crypto.randomUUID();

        await adminClient.from('tasks').insert([
            { id: buyerTaskId, deal_id: dealId, title_en: 'Buyer Task', assigned_participant_id: buyerPartId },
            { id: sellerTaskId, deal_id: dealId, title_en: 'Seller Task', assigned_participant_id: sellerPartId }
        ]);
        console.log('✅ Created Tasks and assigned to participants');

        // 4. TEST ISOLATION: Buyer sees only Buyer Task
        console.log('\n--- TESTING BUYER VISIBILITY ---');
        const { data: buyerTasks } = await buyerClient.from('tasks').select('title_en').eq('deal_id', dealId);
        console.log('Buyer sees tasks:', buyerTasks?.map(t => t.title_en));
        if (buyerTasks?.length !== 1 || buyerTasks[0].title_en !== 'Buyer Task') {
            console.error('❌ FAIL: Buyer visibility is incorrect!');
        } else {
            console.log('✅ PASS: Buyer sees only their task');
        }

        // 5. TEST ISOLATION: Seller sees only Seller Task
        console.log('\n--- TESTING SELLER VISIBILITY ---');
        const { data: sellerTasks } = await sellerClient.from('tasks').select('title_en').eq('deal_id', dealId);
        console.log('Seller sees tasks:', sellerTasks?.map(t => t.title_en));
        if (sellerTasks?.length !== 1 || sellerTasks[0].title_en !== 'Seller Task') {
            console.error('❌ FAIL: Seller visibility is incorrect! (This is likely the BUG)');
        } else {
            console.log('✅ PASS: Seller sees only their task');
        }

        // Clean up
        console.log('\nCleaning up...');
        await serviceClient.from('deals').delete().eq('id', dealId);
        // Participants and tasks should cascade or be deleted manually
        await serviceClient.from('participants').delete().in('id', [buyerPartId, sellerPartId]);
        console.log('✅ Cleanup Complete');

    } catch (err: any) {
        console.error('\n❌ SECURITY REGRESSION FAILED:', err.message);
        process.exit(1);
    }
}

main();
