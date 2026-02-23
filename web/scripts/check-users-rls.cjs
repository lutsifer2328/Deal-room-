const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
    const { data: pol } = await s.rpc('exec_sql', { sql: "SELECT policyname, permissive, roles, cmd, qual, with_check FROM pg_policy pol JOIN pg_class pt ON pt.oid = pol.polrelid WHERE pt.relname = 'users'" });
    console.log(JSON.stringify(pol, null, 2));
})();
