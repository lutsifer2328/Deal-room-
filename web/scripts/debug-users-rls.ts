
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qolozennlzllvrqmibls.supabase.co';
// Service Key for setup
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbG96ZW5ubHpsbHZycW1pYmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg1MTUyNywiZXhwIjoyMDg1NDI3NTI3fQ.3M6fxzDB9YfEFsLtxkdwNbojSHpGdgMhaCdAqIxVkSw';

async function main() {
    console.log('🔍 Testing Users Table RLS...');

    // 1. Setup Client
    const serviceClient = createClient(supabaseUrl, supabaseKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    // 2. Authenticate as Lawyer (Internal)
    const { data: auth, error: loginError } = await serviceClient.auth.signInWithPassword({
        email: 'lawyer@agency.com',
        password: 'Password123!'
    });

    if (loginError) {
        console.error('Login failed (Lawyer):', loginError.message);
        return;
    }

    const lawyerClient = createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: `Bearer ${auth.session?.access_token}` } }
    });

    console.log(`✅ Logged in as Lawyer: ${auth.user?.id}`);

    // 3. Test Select Own User
    console.log('\n--- Test 1: Select Own Record (Lawyer) ---');
    const start1 = Date.now();
    const { data: userData, error: userError } = await lawyerClient
        .from('users')
        .select('*')
        .eq('id', auth.user?.id)
        .single();

    const time1 = Date.now() - start1;
    if (userError) {
        console.error(`❌ Failed (${time1}ms):`, userError);
    } else {
        console.log(`✅ Success (${time1}ms): Found user data.`);
    }

    // 4. Test Select All (should see others if staff check works)
    console.log('\n--- Test 2: Select All Users (Lawyer) ---');
    const start2 = Date.now();
    const { data: allUsers, error: allError } = await lawyerClient
        .from('users')
        .select('id, role')
        .limit(5);

    const time2 = Date.now() - start2;
    if (allError) {
        console.error(`❌ Failed (${time2}ms):`, allError);
    } else {
        console.log(`✅ Success (${time2}ms): Found ${allUsers?.length} users.`);
    }

    // 5. Authenticate as Buyer (External)
    console.log('\n--- Switching to Buyer ---');
    const { data: buyerAuth, error: buyerLoginError } = await serviceClient.auth.signInWithPassword({
        email: 'buyer_test_user@agenzia.com',
        password: 'Password123!'
    });

    if (buyerLoginError) {
        console.error('Login failed (Buyer):', buyerLoginError.message);
        return;
    }

    const buyerClient = createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: `Bearer ${buyerAuth.session?.access_token}` } }
    });

    // 6. Test Select Own User (Buyer)
    console.log('\n--- Test 3: Select Own Record (Buyer) ---');
    const start3 = Date.now();
    const { data: buyerData, error: buyerError } = await buyerClient
        .from('users')
        .select('*')
        .eq('id', buyerAuth.user?.id)
        .single();

    const time3 = Date.now() - start3;
    if (buyerError) {
        console.error(`❌ Failed (${time3}ms):`, buyerError);
    } else {
        console.log(`✅ Success (${time3}ms): Found user data.`);
    }

    // 7. Test Select All (Buyer - should see ONLY self or empty if RLS strict)
    console.log('\n--- Test 4: Select All Users (Buyer) ---');
    const start4 = Date.now();
    const { data: buyerAll, error: buyerAllError } = await buyerClient
        .from('users')
        .select('id')
        .limit(5);

    const time4 = Date.now() - start4;
    if (buyerAllError) {
        console.error(`❌ Failed (${time4}ms):`, buyerAllError);
    } else {
        console.log(`✅ Success (${time4}ms): Found ${buyerAll?.length} users (Expect 1 or 0).`);
    }

}

main();
