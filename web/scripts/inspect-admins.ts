
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qolozennlzllvrqmibls.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbG96ZW5ubHpsbHZycW1pYmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg1MTUyNywiZXhwIjoyMDg1NDI3NTI3fQ.3M6fxzDB9YfEFsLtxkdwNbojSHpGdgMhaCdAqIxVkSw';

async function main() {
    console.log('🔍 INSPECTING CURRENT ADMINS 🔍');
    const client = createClient(supabaseUrl, supabaseKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: admins, error } = await client
        .from('users')
        .select('id, email, role')
        .eq('role', 'admin');

    if (error) { console.error('Error fetching admins:', error); return; }

    console.table(admins);

    // Also verify 'staff'
    const { data: staff } = await client
        .from('users')
        .select('id, email, role')
        .eq('role', 'staff');

    console.log('--- Staff ---');
    console.table(staff);
}

main();
