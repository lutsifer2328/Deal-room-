const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const { writeFileSync, existsSync } = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const sRole = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
    let result = '';

    // Check definition using raw pg_proc
    const { data: funcStr, error: pError } = await sRole.rpc('exec_sql', {
        sql: `
        SELECT p.proname, pg_get_functiondef(p.oid) as def
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname IN ('is_deal_member', 'is_staff', 'is_internal');
        `
    }).catch(() => ({ error: 'RPC failed' }));

    result += `FUNCTION DEFS:\n${JSON.stringify(pError || funcStr, null, 2)}\n\n`;

    writeFileSync('funcs_debug.txt', result);
    console.log('Done functions check');
})();
