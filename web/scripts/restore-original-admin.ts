
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qolozennlzllvrqmibls.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbG96ZW5ubHpsbHZycW1pYmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg1MTUyNywiZXhwIjoyMDg1NDI3NTI3fQ.3M6fxzDB9YfEFsLtxkdwNbojSHpGdgMhaCdAqIxVkSw';

async function main() {
    console.log('🚨 RESTORING ORIGINAL ADMIN (lutsifer@gmail.com) 🚨');
    const client = createClient(supabaseUrl, supabaseKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    const emailToRestore = 'lutsifer@gmail.com';

    // Check if user exists first
    const { data: user, error: findError } = await client.from('users').select('id, role').eq('email', emailToRestore).single();

    if (findError) {
        console.error(`❌ Could not find user ${emailToRestore}:`, findError.message);
        return;
    }

    if (!user) {
        console.error(`❌ User ${emailToRestore} not found in database.`);
        return;
    }

    console.log(`Found user ${emailToRestore} with current role '${user.role}'. Updating to 'admin'...`);

    const { error: updateError } = await client
        .from('users')
        .update({ role: 'admin' })
        .eq('email', emailToRestore);

    if (updateError) {
        console.error(`❌ Failed to restore ${emailToRestore}:`, updateError);
    } else {
        console.log(`✅ SUCCESS: Restored ${emailToRestore} to 'admin'.`);
    }
}

main();
