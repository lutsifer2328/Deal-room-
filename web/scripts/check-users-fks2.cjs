const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
    const { data: q } = await s.rpc('exec_sql', {
        sql: `
        SELECT
            tc.constraint_name,
            tc.table_name,
            kcu.column_name,
            rc.delete_rule
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.referential_constraints AS rc
            ON tc.constraint_name = rc.constraint_name
        WHERE
            ccu.table_name = 'users' OR kcu.column_name = 'user_id' OR kcu.column_name = 'actor_id' OR kcu.column_name = 'created_by'
    ` });
    console.log(q);
})();
