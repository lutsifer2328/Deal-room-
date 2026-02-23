const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    console.log("Fetching all admins...");
    const { data: admins, error } = await client.from('users').select('*').eq('role', 'admin');
    if (error) { console.error("Error:", error); return; }
    console.log(`Found ${admins.length} admins:`);
    admins.forEach(a => console.log(`- ${a.email} | Active: ${a.is_active} | Role: ${a.role}`));
}
main();
