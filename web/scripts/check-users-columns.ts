import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabaseUrl = 'https://qolozennlzllvrqmibls.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbG96ZW5ubHpsbHZycW1pYmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg1MTUyNywiZXhwIjoyMDg1NDI3NTI3fQ.3M6fxzDB9YfEFsLtxkdwNbojSHpGdgMhaCdAqIxVkSw';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

async function checkColumns() {
    // Select a single user to get the keys (columns)
    const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching users:', error);
    } else if (data && data.length > 0) {
        fs.writeFileSync('columns.json', JSON.stringify(Object.keys(data[0]), null, 2));
        console.log('Saved to columns.json');
    } else {
        console.log('No users found in public.users to infer schematic from.');
    }
}

checkColumns();
