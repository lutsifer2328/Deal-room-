
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qolozennlzllvrqmibls.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbG96ZW5ubHpsbHZycW1pYmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg1MTUyNywiZXhwIjoyMDg1NDI3NTI3fQ.3M6fxzDB9YfEFsLtxkdwNbojSHpGdgMhaCdAqIxVkSw';

async function main() {
    console.log('Cleaning up invalid roles...');
    const client = createClient(supabaseUrl, supabaseKey);

    // 1. Uprade any internal 'viewer' to 'staff' (Safety default)
    // We assume anyone currently in the 'users' table who is 'viewer' was meant to be staff but got defaulted.
    // EXTERNAL participants should NOT be in the 'users' table with role 'viewer' in this system if they are purely external.
    // However, the spec says "viewer deprecated (do not use)".

    const { error } = await client
        .from('users')
        .update({ role: 'staff' })
        .eq('role', 'viewer');

    if (error) {
        console.log('Error fixing viewers:', error);
    } else {
        console.log('✅ Converted all "viewer" roles to "staff" in users table.');
    }
}

main();
