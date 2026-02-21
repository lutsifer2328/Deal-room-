import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qolozennlzllvrqmibls.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbG96ZW5ubHpsbHZycW1pYmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg1MTUyNywiZXhwIjoyMDg1NDI3NTI3fQ.3M6fxzDB9YfEFsLtxkdwNbojSHpGdgMhaCdAqIxVkSw';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

async function checkConstraint() {
    const { data: publicUser, error } = await supabaseAdmin
        .from('users')
        .insert({
            id: crypto.randomUUID(),
            email: 'fake-insert-staff@agency.com',
            name: 'Test Trigger User',
            role: 'staff',
            avatar_url: null,
            is_active: true,
            requires_password_change: true
        });

    if (error) {
        console.error('Insert Failed:', error.message);
        console.error('Details:', error.details);
        console.error('Hint:', error.hint);
    } else {
        console.log('Insert succeeded (which is bad!). Role constraint missing.');
    }
}

checkConstraint();
