import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qolozennlzllvrqmibls.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbG96ZW5ubHpsbHZycW1pYmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg1MTUyNywiZXhwIjoyMDg1NDI3NTI3fQ.3M6fxzDB9YfEFsLtxkdwNbojSHpGdgMhaCdAqIxVkSw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('🔄 Promoting Lawyer to Admin...');
    const { error } = await supabase
        .from('users')
        .update({ role: 'admin' })
        .eq('email', 'lawyer@agency.com');

    if (error) console.error('❌ Failed:', error.message);
    else console.log('✅ Updated role to admin');

    // Also update metadata if relevant (though RLS checks public.users usually)
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const u = users.find(x => x.email === 'lawyer@agency.com');
    if (u) {
        const { error: metaError } = await supabase.auth.admin.updateUserById(u.id, { user_metadata: { role: 'admin' } });
        if (metaError) console.error('❌ Meta update failed:', metaError.message);
        else console.log('✅ Updated Auth metadata role to admin');
    }
}

main();
