
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qolozennlzllvrqmibls.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbG96ZW5ubHpsbHZycW1pYmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg1MTUyNywiZXhwIjoyMDg1NDI3NTI3fQ.3M6fxzDB9YfEFsLtxkdwNbojSHpGdgMhaCdAqIxVkSw';

async function main() {
    console.log('🚨 RESTORING ADMIN RIGHTS 🚨');
    const client = createClient(supabaseUrl, supabaseKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    // Restore the user (Tommy Ignatov)
    const emailToRestore = 'tommyignatov@yahoo.com';

    const { error: updateError } = await client
        .from('users')
        .update({ role: 'admin' })
        .eq('email', emailToRestore);

    if (updateError) {
        console.error(`❌ Failed to restore ${emailToRestore}:`, updateError);
    } else {
        console.log(`✅ SUCCESS: Restored ${emailToRestore} to 'admin'.`);
    }

    // Double check admin@agency.com too
    await client.from('users').update({ role: 'admin' }).eq('email', 'admin@agency.com');
}

main();
