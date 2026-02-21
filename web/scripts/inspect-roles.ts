
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qolozennlzllvrqmibls.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbG96ZW5ubHpsbHZycW1pYmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg1MTUyNywiZXhwIjoyMDg1NDI3NTI3fQ.3M6fxzDB9YfEFsLtxkdwNbojSHpGdgMhaCdAqIxVkSw';

async function main() {
    console.log('🔍 Inspecting Users Roles...');
    const client = createClient(supabaseUrl, supabaseKey);

    // Fetch last 5 users
    const { data: users, error } = await client
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.table(users.map(u => ({
        id: u.id,
        email: u.email,
        role: u.role,
        is_active: u.is_active,
        raw_role: `"${u.role}"` // Check for whitespace
    })));
}

main();
