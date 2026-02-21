import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qolozennlzllvrqmibls.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbG96ZW5ubHpsbHZycW1pYmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg1MTUyNywiZXhwIjoyMDg1NDI3NTI3fQ.3M6fxzDB9YfEFsLtxkdwNbojSHpGdgMhaCdAqIxVkSw';

async function testFunction() {
    const { data: auth } = await createClient(supabaseUrl, supabaseKey).auth.signInWithPassword({
        email: 'buyer_test_user@agenzia.com',
        password: 'Password123!'
    });

    const client = createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: `Bearer ${auth.session?.access_token}` } }
    });

    const testUuid = '00000000-0000-0000-0000-000000000000'; // Valid UUID format
    const path = `${testUuid}/folder/file.pdf`;

    console.log('Testing try_cast_uuid function as Buyer...');

    const { data, error } = await client.rpc('try_cast_uuid', { input_text: testUuid });
    console.log('Result (Direct):', data, error?.message || 'OK');

    // Test with split_part logic simulation if possible, or just trust the function works.
    // The policy does: try_cast_uuid(split_part(name, '/', 1))
    // We can't easily test the split_part inside RPC unless we make a wrapper, but let's test the cast part.
}

testFunction();
