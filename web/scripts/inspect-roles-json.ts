
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qolozennlzllvrqmibls.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbG96ZW5ubHpsbHZycW1pYmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg1MTUyNywiZXhwIjoyMDg1NDI3NTI3fQ.3M6fxzDB9YfEFsLtxkdwNbojSHpGdgMhaCdAqIxVkSw';

async function main() {
    console.log('START_JSON_OUTPUT');
    const client = createClient(supabaseUrl, supabaseKey);

    // Fetch last 5 users
    const { data: users, error } = await client
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.log(JSON.stringify({ error }));
        return;
    }

    console.log(JSON.stringify(users, null, 2));
    console.log('END_JSON_OUTPUT');
}

main();
