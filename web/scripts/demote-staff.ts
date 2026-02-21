
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qolozennlzllvrqmibls.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbG96ZW5ubHpsbHZycW1pYmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg1MTUyNywiZXhwIjoyMDg1NDI3NTI3fQ.3M6fxzDB9YfEFsLtxkdwNbojSHpGdgMhaCdAqIxVkSw';

async function main() {
    console.log('Demoting test participants...');
    const client = createClient(supabaseUrl, supabaseKey);

    // We want to keep:
    // - admin@agency.com (Admin)
    // - lawyer@agency.com (Lawyer - but their role is 'admin' based on screenshot)
    // - staff@agency.com (Staff)
    // - Any other real staff?

    // The list of 'staff' we saw included:
    // - buyer_test_user@agenzia.com
    // - seller_test_user@agenzia.com
    // - sec_reg_lawyer_...@test.com
    // - kalin@yahoo.com (User said this one IS staff, so KEEP him)
    // - tommyignatov@yahoo.com (User screenshot showed him as Viewer, so maybe demote him back to User?)

    // Strategy: 
    // Downgrade everyone who is 'staff' EXCEPT the known valid ones.

    const keepAsStaff = [
        'staff@agency.com',
        'kalin@yahoo.com', // User explicitly confirmed this is staff
        'admin@agency.com',
        'lawyer@agency.com' // Often used as admin
    ];

    const { data: staffUsers } = await client.from('users').select('id, email').eq('role', 'staff');

    if (!staffUsers) return;

    for (const u of staffUsers) {
        if (keepAsStaff.includes(u.email)) {
            console.log(`Skipping (Valid Staff): ${u.email}`);
            continue;
        }

        console.log(`Demoting to 'user': ${u.email}`);
        await client.from('users').update({ role: 'user' }).eq('id', u.id);
    }

    console.log('Cleanup complete.');
}

main();
