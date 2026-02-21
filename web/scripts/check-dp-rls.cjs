const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const { writeFileSync } = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const sRole = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
    let result = '';

    const { data: policies } = await sRole.rpc('exec_sql', {
        sql: `
        SELECT policyname, permissive, roles, cmd, qual, with_check 
        FROM pg_policies 
        WHERE tablename = 'deal_participants';
        `
    });

    result += `DEAL PARTICIPANTS POLICIES:\n${JSON.stringify(policies, null, 2)}\n\n`;

    writeFileSync('deal_participants_rls.txt', result);
    console.log('Done RLS check');
})();
