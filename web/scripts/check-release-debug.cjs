const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '.env.local' });
const { writeFileSync } = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const sRole = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
    let result = '';

    // Check update policies using postgres function
    const { data, error } = await sRole.rpc('exec_sql', {
        sql: `
        SELECT policyname, pg_get_expr(rls.quals, rls.polrelid) as USING, pg_get_expr(rls.with_check, rls.polrelid) as WITH_CHECK
        FROM pg_policies pol
        JOIN pg_class t ON pol.tablename = t.relname
        JOIN pg_policy rls ON pol.policyname = rls.polname AND rls.polrelid = t.oid
        WHERE tablename = 'documents' AND cmd = 'UPDATE';
        `
    });

    result += `UPDATE POLICIES:\n${JSON.stringify(error || data, null, 2)}\n\n`;

    // Also check what the admin's role actually maps to when executing is_staff()
    const { data: staffData } = await sRole.rpc('exec_sql', {
        sql: `
        BEGIN;
        SELECT set_config('request.jwt.claims', json_build_object('sub', '8f51b0ca-17ca-4b17-b40b-b19a9c28f756', 'role', 'authenticated')::text, true);
        SELECT set_config('role', 'authenticated', true);
        
        -- Test is_staff
        SELECT public.is_staff() as admin_is_staff;
        COMMIT;
        `
    });

    result += `IS STAFF EVAL:\n${JSON.stringify(staffData, null, 2)}\n\n`;

    writeFileSync('release_debug.txt', result);
    console.log('Done release debug');
})();
