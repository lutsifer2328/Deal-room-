
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qolozennlzllvrqmibls.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbG96ZW5ubHpsbHZycW1pYmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg1MTUyNywiZXhwIjoyMDg1NDI3NTI3fQ.3M6fxzDB9YfEFsLtxkdwNbojSHpGdgMhaCdAqIxVkSw';

async function main() {
    const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    const targetEmail = 'admin@agency.com';
    const newPassword = 'Phase2TestAdmin123!';

    console.log(`🔍 Finding user: ${targetEmail}`);
    
    // Find in auth.users via admin API
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
        console.error('❌ Failed to list users:', listError);
        return;
    }

    const user = users.find(u => u.email === targetEmail);

    if (!user) {
        console.error(`❌ User not found in auth.users: ${targetEmail}`);
        return;
    }

    console.log(`✅ Found user ID: ${user.id}. Resetting password...`);

    const { error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { password: newPassword }
    );

    if (updateError) {
        console.error('❌ Failed to update password:', updateError);
    } else {
        console.log(`🚀 SUCCESS: Password reset for ${targetEmail} to: ${newPassword}`);
    }
}

main();
