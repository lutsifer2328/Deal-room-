const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const { writeFileSync } = require('fs');

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
    let result = '';

    // Check RLS policies using exec_sql
    const { data: pol } = await s.rpc('exec_sql', { sql: "SELECT policyname, permissive, roles, cmd, qual, with_check FROM pg_policy pol JOIN pg_class pt ON pt.oid = pol.polrelid WHERE pt.relname = 'deals'" });
    result += `DEALS_POLICIES: ${JSON.stringify(pol, null, 2)}\n\n`;

    const { data: polP } = await s.rpc('exec_sql', { sql: "SELECT policyname, permissive, roles, cmd, qual, with_check FROM pg_policy pol JOIN pg_class pt ON pt.oid = pol.polrelid WHERE pt.relname = 'deal_participants'" });
    result += `DEALS_PARTICIPANTS_POLICIES: ${JSON.stringify(polP, null, 2)}\n\n`;

    // See exactly what deals a generic anon/authenticated user gets
    // Well, service_role bypasses auth. We can't easily fake the user in this script without a token.

    writeFileSync('rls_check.txt', result);
    console.log('Done RLS');
})();
