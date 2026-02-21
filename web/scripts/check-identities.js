
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qolozennlzllvrqmibls.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbG96ZW5ubHpsbHZycW1pYmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg1MTUyNywiZXhwIjoyMDg1NDI3NTI3fQ.3M6fxzDB9YfEFsLtxkdwNbojSHpGdgMhaCdAqIxVkSw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkIdentities() {
    console.log('--- Checking Users ---');
    const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, email, role, is_active')
        .order('role');

    if (userError) console.error('Error fetching users:', userError);
    else console.table(users);

    console.log('\n--- Checking Participants ---');
    const { data: participants, error: partError } = await supabase
        .from('participants')
        .select('id, email, invitation_status, user_id')
        .order('email');

    if (partError) console.error('Error fetching participants:', partError);
    else console.table(participants);

    // Also check Auth Users (since we have service role)
    console.log('\n--- Checking Auth Users (Limit 10) ---');
    const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) console.error('Error fetching auth users:', authError);
    else {
        console.table(authUsers.map(u => ({ id: u.id, email: u.email, last_sign_in: u.last_sign_in_at })));
    }
}

checkIdentities();
