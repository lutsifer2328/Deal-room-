const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const { writeFileSync } = require('fs');

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
    let result = '';

    const { data: policies, error } = await s.rpc('get_table_policies', { table_name: 'documents' });

    if (error) {
        // Fallback if RPC doesn't exist
        const { data: dbPolicies } = await s.rpc('exec_sql', { sql: "SELECT * FROM pg_policies WHERE tablename = 'documents';" });
        result += `POLICIES (RPC fallback):\n${JSON.stringify(dbPolicies, null, 2)}\n\n`;
    } else {
        result += `POLICIES:\n${JSON.stringify(policies, null, 2)}\n\n`;
    }

    writeFileSync('docs_rls.txt', result);
    console.log('Done RLS docs');
})();
