const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
    // 1. Fetch users
    const { data: users, error } = await s.from('users').select('*');
    if (error) { console.error(error); return; }

    // Find Kalin Kalinov
    const target = users.find(u => u.name && u.name.includes('Kalin'));
    if (!target) return console.log('No Kalin found');

    console.log('Target to deactivate:', target.name, target.id);

    // Update using service role
    const { data, error: updateError } = await s.from('users').update({ is_active: false }).eq('id', target.id).select();

    if (updateError) {
        console.error('Update ERROR:', updateError);
    } else {
        console.log('Update SUCCESS payload:', data);
    }
})();
