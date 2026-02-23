const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    console.log("--- Participants Table Schema Sample ---");
    const { data: pData, error: pErr } = await client.from('participants').select('*').limit(1);
    console.log(pErr ? pErr : pData);

    console.log("\n--- Deal Participants Table Schema Sample ---");
    const { data: dpData, error: dpErr } = await client.from('deal_participants').select('*').limit(1);
    console.log(dpErr ? dpErr : dpData);
}

main();
