import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qolozennlzllvrqmibls.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbG96ZW5ubHpsbHZycW1pYmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg1MTUyNywiZXhwIjoyMDg1NDI3NTI3fQ.3M6fxzDB9YfEFsLtxkdwNbojSHpGdgMhaCdAqIxVkSw';
const client = createClient(supabaseUrl, supabaseKey);

async function checkPolicies() {
    console.log('Checking RLS Policies...');
    const { data, error } = await client.rpc('get_policies'); // If I had such a function...

    // Instead query pg_policies if exposed, but it usually isn't via API.
    // I can try to simply select from participants as the Buyer and see if I get anything.

    // 1. Login as Buyer
    const { data: auth } = await client.auth.signInWithPassword({
        email: 'buyer_test_user@agenzia.com',
        password: 'Password123!'
    });
    const buyerClient = createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: `Bearer ${auth.session?.access_token}` } }
    });

    // 2. Try to read own participant record
    console.log(`Buyer ID: ${auth.user?.id}`);
    const { data: pData, error: pError } = await buyerClient
        .from('participants')
        .select('*')
        .eq('user_id', auth.user?.id);

    console.log('Participants Read:', pData?.length, pError?.message || 'OK');

    // 3. Try to read deal_participants
    const { data: dpData, error: dpError } = await buyerClient
        .from('deal_participants')
        .select('*'); // Should probably filter, but let's see if we see ANYTHING

    console.log('Deal Participants Read (All):', dpData?.length, dpError?.message || 'OK');
}

checkPolicies();
