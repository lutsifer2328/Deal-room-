const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function main() {
    const email = 'test_admin@agenzia.com';
    const { data: user, error: userErr } = await client.from('users').select('id, role').eq('email', email).single();
    if (userErr) { console.error('Error finding user:', userErr); return; }

    // The enum might be lowercase admin
    const { error: updateErr } = await client.from('users').update({ role: 'admin' }).eq('id', user.id);
    if (updateErr) { console.error('Error updating role:', updateErr); return; }

    console.log('Successfully promoted test user to admin');
}
main();
