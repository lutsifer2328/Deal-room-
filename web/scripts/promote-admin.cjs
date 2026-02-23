const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function main() {
    const email = 'test_admin@agenzia.com';
    const { data: user, error: userErr } = await client.from('users').select('id, role').eq('email', email).single();
    if (userErr) { console.error('Error finding user:', userErr); return; }

    console.log(`Current role for ${email}: ${user.role}`);

    const { error: updateErr } = await client.from('users').update({ role: 'Admin' }).eq('id', user.id);
    if (updateErr) { console.error('Error updating role:', updateErr); return; }

    // Also check test_admin_2
    const { data: user2 } = await client.from('users').select('id, role').eq('email', 'test_admin_2@agenzia.com').single();
    if (user2) {
        await client.from('users').update({ role: 'Admin' }).eq('id', user2.id);
    }

    console.log('Successfully promoted test users to Admin role in public.users table.');
}
main();
