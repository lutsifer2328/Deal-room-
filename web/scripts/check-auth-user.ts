
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qolozennlzllvrqmibls.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbG96ZW5ubHpsbHZycW1pYmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg1MTUyNywiZXhwIjoyMDg1NDI3NTI3fQ.3M6fxzDB9YfEFsLtxkdwNbojSHpGdgMhaCdAqIxVkSw';

async function main() {
    console.log('🔍 Checking Auth User: lutsifer@gmail.com');
    const client = createClient(supabaseUrl, supabaseKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    // We need to list users because get user by email isn't a direct admin method in some versions,
    // but looking at docs, listUsers is best.

    const { data, error } = await client.auth.admin.listUsers();

    if (error) {
        console.error('Error listing users:', error);
        return;
    }

    const startUser = data.users.find(u => u.email === 'lutsifer@gmail.com');

    if (startUser) {
        console.log(`✅ Auth User Found: ${startUser.id}`);
        console.log(`   Email: ${startUser.email}`);
        console.log(`   Confirmed At: ${startUser.email_confirmed_at}`);
        console.log(`   Last Sign In: ${startUser.last_sign_in_at}`);

        // Check public user mapping
        const { data: publicUser } = await client.from('users').select('*').eq('id', startUser.id).single();
        console.log('   Public User Role:', publicUser?.role);
    } else {
        console.log('❌ Auth User NOT FOUND.');
    }
}

main();
