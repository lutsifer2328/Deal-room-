
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qolozennlzllvrqmibls.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbG96ZW5ubHpsbHZycW1pYmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg1MTUyNywiZXhwIjoyMDg1NDI3NTI3fQ.3M6fxzDB9YfEFsLtxkdwNbojSHpGdgMhaCdAqIxVkSw';

async function main() {
    console.log('🔐 Force resetting password for lutsifer@gmail.com...');
    const admin = createClient(supabaseUrl, supabaseKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    // 1. Find the user in public.users to get ID
    const { data: pubUser, error: pubErr } = await admin
        .from('users')
        .select('id, email, role')
        .eq('email', 'lutsifer@gmail.com')
        .single();

    if (pubErr || !pubUser) {
        console.error('❌ Not found in public.users:', pubErr?.message);
        return;
    }
    console.log(`✅ Found in public.users: id=${pubUser.id}, role=${pubUser.role}`);

    // 2. Get auth user
    const { data: authData, error: authErr } = await admin.auth.admin.getUserById(pubUser.id);
    if (authErr) {
        console.error('❌ Auth lookup failed:', authErr.message);
        return;
    }
    console.log(`✅ Auth user exists: email=${authData.user.email}, confirmed=${authData.user.email_confirmed_at}`);
    console.log(`   Banned until: ${authData.user.banned_until}`);
    console.log(`   Factors: ${JSON.stringify(authData.user.factors)}`);

    // 3. Force update password + confirm email + unban
    const { data: updated, error: updateErr } = await admin.auth.admin.updateUserById(pubUser.id, {
        password: 'Tommy23',
        email_confirm: true,
        ban_duration: 'none', // Unban if banned
    });

    if (updateErr) {
        console.error('❌ Password update FAILED:', updateErr.message);
        return;
    }
    console.log('✅ Password set to "Tommy23"');
    console.log(`   Email confirmed: ${updated.user.email_confirmed_at}`);
    console.log(`   Banned until: ${updated.user.banned_until}`);

    // 4. VERIFY by attempting login with anon key
    const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbG96ZW5ubHpsbHZycW1pYmxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NTE1MjcsImV4cCI6MjA4NTQyNzUyN30.vu549GpXoQGMwVs92PB4IC8IL9hniLWS9FDLsl28M8';
    const anonClient = createClient(supabaseUrl, anonKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: loginData, error: loginErr } = await anonClient.auth.signInWithPassword({
        email: 'lutsifer@gmail.com',
        password: 'Tommy23'
    });

    if (loginErr) {
        console.error('❌ VERIFICATION LOGIN FAILED:', loginErr.message, loginErr.status);
    } else {
        console.log('✅ VERIFICATION LOGIN SUCCESS! User ID:', loginData.user?.id);
    }
}

main();
