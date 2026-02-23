const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    const emailsToCheck = [
        'test_staff_new_1@agenzia.com',
        'test-staff-final@agency.com',
        'fake-insert-staff@agency.com'
    ];

    console.log("--- Checking Public `users` table ---");
    const { data: publicUsers } = await client.from('users').select('email, role, is_active').in('email', emailsToCheck);
    console.log(publicUsers);

    console.log("\n--- Checking global `participants` table ---");
    const { data: participants } = await client.from('participants').select('email, name').in('email', emailsToCheck);
    console.log(participants);

    console.log("\n--- Checking Supabase Auth ---");
    const { data: authData } = await client.auth.admin.listUsers();
    const authUsers = authData?.users.filter(u => emailsToCheck.includes(u.email));
    console.log(authUsers.map(u => ({ email: u.email, id: u.id })));
}

main();
