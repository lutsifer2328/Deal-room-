import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qolozennlzllvrqmibls.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbG96ZW5ubHpsbHZycW1pYmxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NTE1MjcsImV4cCI6MjA4NTQyNzUyN30.vu549GpXoQGGMwVs92PB4IC8IL9hniLWS9FDLsl28M8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
    // Authenticate as original admin (same as browser)
    const { error: loginError } = await supabase.auth.signInWithPassword({
        email: 'lutsifer@gmail.com',
        password: 'Tommy23'
    });

    if (loginError) {
        console.error('Login failed:', loginError);
        return;
    }

    console.log('✅ Logged in as lutsifer@gmail.com');

    // Fetch users as this authenticated user
    const { data: users, error: fetchError } = await supabase
        .from('users')
        .select('*');

    if (fetchError) {
        console.error('Fetch error:', fetchError);
        return;
    }

    console.log(`✅ Fetched ${users?.length} users.`);

    const testStaff = users?.find(u => u.email === 'test-staff-1@agency.com');
    if (testStaff) {
        console.log('✅ Found test-staff-1 in fetched list:', testStaff);
    } else {
        console.log('❌ test-staff-1 NOT found in fetched list. RLS is blocking it!');

        // Let's dump the ones we DO see
        console.log(users?.map(u => u.email));
    }
}

main();
