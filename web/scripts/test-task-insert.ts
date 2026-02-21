import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = 'https://qolozennlzllvrqmibls.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbG96ZW5ubHpsbHZycW1pYmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg1MTUyNywiZXhwIjoyMDg1NDI3NTI3fQ.3M6fxzDB9YfEFsLtxkdwNbojSHpGdgMhaCdAqIxVkSw';

const serviceClient = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
    console.log('🧪 Testing Task Insertion...');

    // Fetch a valid user first
    const { data: userData } = await serviceClient.from('users').select('id').limit(1).single();
    if (!userData) {
        console.error('No users found! Cannot create deal.');
        return;
    }
    const userId = userData.id;
    console.log('Found user:', userId);

    const newDealId = crypto.randomUUID();
    const { error: dErr } = await serviceClient.from('deals').insert({
        id: newDealId,
        title: 'Test Deal',
        created_by: userId
    });
    if (dErr) {
        console.log('Deal insert error:', dErr.message);
        return;
    }
    console.log('Deal created:', newDealId);

    // Test 1: Minimal with title_en
    console.log('Test 1: Minimal (title_en, status)');
    const t1 = await serviceClient.from('tasks').insert({
        deal_id: newDealId,
        title_en: 'Test 1',
        status: 'pending'
    });
    if (t1.error) console.error('T1 Failed:', t1.error.message);
    else console.log('T1 Success');

    // Test 2: + title_bg
    console.log('Test 2: + title_bg');
    const t2 = await serviceClient.from('tasks').insert({
        deal_id: newDealId,
        title_en: 'Test 2',
        title_bg: 'Test 2', // Suspect
        status: 'pending'
    });
    if (t2.error) console.error('T2 Failed:', t2.error.message);
    else console.log('T2 Success');

    // Test 3: + assigned_participant_id
    console.log('Test 3: + assigned_participant_id');
    const t3 = await serviceClient.from('tasks').insert({
        deal_id: newDealId,
        title_en: 'Test 3',
        assigned_participant_id: crypto.randomUUID(), // Suspect FK
        // Note: assigned_participant_id is FK to participants. If participant doesn't exist, this will fail FK constraint, NOT schema error.
        // We want to see Schema error if column doesn't exist.
        status: 'pending'
    });
    if (t3.error) console.error('T3 Failed:', t3.error.message);
    else console.log('T3 Success');

    // Test 4: + assigned_to
    console.log('Test 4: + assigned_to');
    const t4 = await serviceClient.from('tasks').insert({
        deal_id: newDealId,
        title_en: 'Test 4',
        assigned_to: 'test@test.com',
        status: 'pending'
    });
    if (t4.error) console.error('T4 Failed:', t4.error.message);
    else console.log('T4 Success');

    // Test 5: Full payload
    console.log('Test 5: Full Payload');
    const t5 = await serviceClient.from('tasks').insert({
        deal_id: newDealId,
        title_en: 'Test 5',
        title_bg: 'Test 5',
        assigned_to: 'test@test.com',
        assigned_participant_id: crypto.randomUUID(), // FK failure likely, but checks column existence
        status: 'pending',
        required: true,
        created_at: new Date().toISOString()
    });
    if (t5.error) console.error('T5 Failed:', t5.error.message);
    else console.log('T5 Success');
}

main();
