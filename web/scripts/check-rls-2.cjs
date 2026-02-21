const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const { writeFileSync } = require('fs');

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
    let result = '';

    // Check RLS policies using the pg_policies view
    const { data: pol, error } = await s.rpc('exec_sql', { sql: "SELECT * FROM pg_policies WHERE tablename = 'deals'" });
    result += `DEALS_POLICIES: ${JSON.stringify(pol, null, 2)}\nERROR: ${JSON.stringify(error)}\n\n`;

    // Also let's check tasks
    const { data: polT } = await s.rpc('exec_sql', { sql: "SELECT * FROM pg_policies WHERE tablename = 'tasks'" });
    result += `TASKS_POLICIES: ${JSON.stringify(polT, null, 2)}\n\n`;

    writeFileSync('rls_check_2.txt', result);
    console.log('Done RLS 2');
})();
