
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qolozennlzllvrqmibls.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbG96ZW5ubHpsbHZycW1pYmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg1MTUyNywiZXhwIjoyMDg1NDI3NTI3fQ.3M6fxzDB9YfEFsLtxkdwNbojSHpGdgMhaCdAqIxVkSw';

async function main() {
    console.log('Inspecting Kalin...');
    const client = createClient(supabaseUrl, supabaseKey);

    // Fetch user by email
    const { data: users, error } = await client
        .from('users')
        .select('id, email, role, is_active')
        .eq('email', 'kalin@yahoo.com');

    if (error) {
        console.log('Error:', error);
        return;
    }

    console.log('Found:', users);
}

main();
