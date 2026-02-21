import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qolozennlzllvrqmibls.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbG96ZW5ubHpsbHZycW1pYmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg1MTUyNywiZXhwIjoyMDg1NDI3NTI3fQ.3M6fxzDB9YfEFsLtxkdwNbojSHpGdgMhaCdAqIxVkSw';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function main() {
    const email = 'test-staff-final@agency.com';
    console.log(`🔍 Checking DB for user: ${email}`);

    const { data: authUser, error: authError } = await supabase.auth.admin.listUsers();
    const foundAuth = authUser?.users.find(u => u.email === email);

    if (foundAuth) {
        console.log('✅ Found in Auth:', foundAuth.id);
    } else {
        console.log('❌ NOT Found in Auth:', authError?.message || 'No match');
    }

    const { data: publicUser, error: publicError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email);

    if (publicUser && publicUser.length > 0) {
        console.log('✅ Found in public.users, ROLE IS:', publicUser[0].role);
    } else {
        console.log('❌ NOT Found in public.users:', publicError?.message || 'No match');
    }
}

main();
