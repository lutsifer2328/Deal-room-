import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qolozennlzllvrqmibls.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbG96ZW5ubHpsbHZycW1pYmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg1MTUyNywiZXhwIjoyMDg1NDI3NTI3fQ.3M6fxzDB9YfEFsLtxkdwNbojSHpGdgMhaCdAqIxVkSw';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
    const email = `test-trigger-${Date.now()}@agency.com`;
    console.log(`Testing user creation for: ${email}`);

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
            name: 'Test Trigger',
            role: 'staff'
        }
    });

    if (error) {
        console.error('❌ Auth Error Details:\n', 'Message:', error.message, '\nStatus:', error.status);
        return;
    }

    console.log('✅ User created successfully:', data.user.id);

    const { data: publicUser } = await supabaseAdmin.from('users').select('*').eq('id', data.user.id).single();
    console.log('Public User Record:', publicUser);
}

main();
