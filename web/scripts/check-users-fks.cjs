const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
    // Get constraints referencing users.id
    const { data: fks } = await s.rpc('exec_sql', {
        sql: `
        SELECT
            tc.table_name, kcu.column_name, rc.update_rule, rc.delete_rule
        FROM
            information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.referential_constraints AS rc
              ON tc.constraint_name = rc.constraint_name
        WHERE
            tc.constraint_type = 'FOREIGN KEY'
            AND (
                SELECT table_name FROM information_schema.constraint_column_usage 
                WHERE constraint_name = tc.constraint_name LIMIT 1
            ) = 'users'
    ` });
    console.log('FKs referencing users:', JSON.stringify(fks, null, 2));
})();
