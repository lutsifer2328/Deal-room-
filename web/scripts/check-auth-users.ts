import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qolozennlzllvrqmibls.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbG96ZW5ubHpsbHZycW1pYmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg1MTUyNywiZXhwIjoyMDg1NDI3NTI3fQ.3M6fxzDB9YfEFsLtxkdwNbojSHpGdgMhaCdAqIxVkSw';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

async function checkUsers() {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
        console.error('Error fetching auth users:', error);
        return;
    }

    const testUsers = data.users.filter(u => u.email?.includes('test-api-') || u.email?.includes('test-trigger-') || u.email?.includes('test-staff-101'));

    console.log(`Found ${testUsers.length} failed test users in auth.users:`);
    testUsers.forEach(u => console.log(`- ${u.email} (ID: ${u.id})`));
}

checkUsers();
