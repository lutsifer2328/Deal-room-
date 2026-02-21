import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qolozennlzllvrqmibls.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbG96ZW5ubHpsbHZycW1pYmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg1MTUyNywiZXhwIjoyMDg1NDI3NTI3fQ.3M6fxzDB9YfEFsLtxkdwNbojSHpGdgMhaCdAqIxVkSw';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

async function checkSchema() {
    console.log('Fetching active PG Types...');
    const { data: types, error: tErr } = await supabaseAdmin.rpc('run_sql', {
        query: `SELECT typname, enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE typname = 'user_role';`
    });

    if (tErr) console.error('Error fetching types:', tErr);
    console.log('Enum types:', types);
}

checkSchema();
