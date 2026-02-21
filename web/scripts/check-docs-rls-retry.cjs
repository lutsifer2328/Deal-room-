const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const { writeFileSync } = require('fs');

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
    let result = '';

    // Check RLS policies using pg_policies
    const { data: pol, error } = await s.rpc('exec_sql', { sql: "SELECT * FROM pg_policies WHERE tablename = 'documents'" });
    result += `DOCUMENTS_POLICIES: ${JSON.stringify(pol, null, 2)}\nERROR: ${JSON.stringify(error)}\n\n`;

    writeFileSync('docs_rls_retry.txt', result);
    console.log('Done RLS retry');
})();
