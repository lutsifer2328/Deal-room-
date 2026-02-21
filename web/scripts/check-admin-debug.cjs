const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const { writeFileSync } = require('fs');

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
    let result = '';

    // Check is_internal source code
    const { data: func } = await s.rpc('exec_sql', { sql: "SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'is_internal'" });
    result += `IS_INTERNAL FUNC:\n${JSON.stringify(func, null, 2)}\n\n`;

    // Check documents policies
    const { data: pol } = await s.rpc('exec_sql', { sql: "SELECT policyname, cmd, quals, with_check FROM pg_policies WHERE tablename = 'documents'" });
    result += `DOCUMENTS POLICIES:\n${JSON.stringify(pol, null, 2)}\n\n`;

    // Check what role 
    const { data: adminUser } = await s.from('users').select('id, role').eq('id', 'a8d6e314-4f52-46ca-bcd5-c884e91af89d');
    result += `ADMIN USER DB RECORD:\n${JSON.stringify(adminUser, null, 2)}\n\n`;

    writeFileSync('admin_debug.txt', result);
    console.log('Done admin debug');
})();
