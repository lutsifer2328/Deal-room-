const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY
);

(async () => {
    try {
        console.log('--- Generating JWT ---');
        // Let's sign in the admin user we just reset
        const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
            email: 'lutsifer@gmail.com',
            password: 'Tommy23'
        });

        if (authError) throw authError;

        const token = authData.session.access_token;
        console.log('✅ Token acquired');

        console.log('--- Sending Invite Request ---');
        const response = await fetch('http://localhost:3000/api/participants/invite', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'testinvite99@test.com',
                dealId: 'ca6a0ce8-0cb9-4f6c-9ddb-8e1a994cd95f',
                name: 'Bobby Test 99'
            })
        });

        const body = await response.text();
        console.log('\n--- API Response ---');
        console.log(`Status: ${response.status}`);
        try {
            console.log(JSON.stringify(JSON.parse(body), null, 2));
        } catch {
            console.log(body);
        }

    } catch (err) {
        console.error('Script failed:', err);
    }
})();
