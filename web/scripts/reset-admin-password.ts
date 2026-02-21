
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qolozennlzllvrqmibls.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbG96ZW5ubHpsbHZycW1pYmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg1MTUyNywiZXhwIjoyMDg1NDI3NTI3fQ.3M6fxzDB9YfEFsLtxkdwNbojSHpGdgMhaCdAqIxVkSw';

async function main() {
    console.log('🔍 Checking Auth User: lutsifer@gmail.com');
    const client = createClient(supabaseUrl, supabaseKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    // 1. Get ID from public.users
    const { data: publicUser, error: publicError } = await client
        .from('users')
        .select('id, email, role')
        .eq('email', 'lutsifer@gmail.com')
        .single();

    if (publicError || !publicUser) {
        console.error('❌ User NOT found in public.users:', publicError?.message);
        return;
    }

    console.log(`✅ Found in public.users: ${publicUser.id} (${publicUser.role})`);

    // 2. Check Auth User
    const { data: authData, error: authError } = await client.auth.admin.getUserById(publicUser.id);

    if (authError) {
        console.error('❌ Auth User Lookup FAILED:', authError.message);
        // If "User not found", we might need to recreate them?
        return;
    }

    const authUser = authData.user;
    if (authUser) {
        console.log(`✅ Auth User Exists: ${authUser.id}`);
        console.log(`   Email Confirmed: ${authUser.email_confirmed_at}`);
        console.log(`   Last Sign In: ${authUser.last_sign_in_at}`);

        // 3. FORCE PASSWORD RESET
        // User stated password is 'Tommy23'. Let's ensure it matches.
        console.log('🔄 Resetting password to "Tommy23" to ensure access...');

        const { data: updateData, error: updateError } = await client.auth.admin.updateUserById(authUser.id, {
            password: 'Tommy23',
            email_confirm: true // Auto confirm if wasn't
        });

        if (updateError) {
            console.error('❌ Password Reset FAILED:', updateError.message);
        } else {
            console.log('✅ Password Successfully Reset to "Tommy23"');
        }
    } else {
        console.log('❌ Auth User returned null (unexpected).');
    }
}

main();
