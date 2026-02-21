const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const { writeFileSync } = require('fs');

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
    let result = '';

    // 1. Check what tables exist related to participants
    const { data: tables } = await s.rpc('exec_sql', { sql: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%participant%'" }).maybeSingle();
    result += `TABLES WITH 'participant': ${JSON.stringify(tables)}\n\n`;

    // 2. Try alternate approach listing all public tables
    const { data: allTables, error: tableErr } = await s.from('deal_participants').select('*').limit(1);
    result += `deal_participants sample: ${JSON.stringify(allTables)} | error: ${JSON.stringify(tableErr)}\n\n`;

    // 3. Try 'participants' table
    const { data: p2, error: p2err } = await s.from('participants').select('*').limit(1);
    result += `participants sample: ${JSON.stringify(p2)} | error: ${JSON.stringify(p2err)}\n\n`;

    // 4. Check the deals table for embedded participants - select first deal
    const { data: deal } = await s.from('deals').select('*').limit(1).single();
    result += `DEAL COLUMNS: ${deal ? Object.keys(deal).join(', ') : 'none'}\n\n`;

    // 5. Check if tommy has user_id linkage in deal_participants
    const tommyId = '7fe10a22-b837-4fe0-a4bd-72a36f4df91b';
    const { data: dpAll, error: dpErr } = await s.from('deal_participants').select('*').or(`user_id.eq.${tommyId},email.eq.tommy@imotco.bg`);
    result += `deal_participants for tommy (or): ${JSON.stringify(dpAll)} | error: ${JSON.stringify(dpErr)}\n\n`;

    // 6. Get ALL deal_participants to see if the table even has data
    const { data: dpCount, error: dpCountErr, count } = await s.from('deal_participants').select('*', { count: 'exact' }).limit(3);
    result += `deal_participants total count: ${count} | sample: ${JSON.stringify(dpCount)} | error: ${JSON.stringify(dpCountErr)}\n`;

    writeFileSync('tommy_check.txt', result);
    console.log('Done');
})();
