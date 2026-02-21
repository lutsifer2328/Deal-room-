const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '.env.local' });
const { writeFileSync } = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Need the JWT secret to sign a token, it is usually not in env.local
// Wait, I can't easily get the JWT secret unless I read it or maybe can auth with password?
// Let's just create a quick test using postgres function set_config('request.jwt.claims', ...) via service role
// to impersonate the user and SELECT from documents!

const sRole = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
    let result = '';

    // Impersonate Admin (8f51b0ca-17ca-4b17-b40b-b19a9c28f756)
    const adminId = '8f51b0ca-17ca-4b17-b40b-b19a9c28f756';

    // We can execute SQL as authenticated user by wrapping it in a transaction
    const { data, error } = await sRole.rpc('exec_sql', {
        sql: `
        BEGIN;
        -- Set local auth.uid() by setting standard supabase config
        SELECT set_config('request.jwt.claims', json_build_object('sub', '${adminId}', 'role', 'authenticated')::text, true);
        SELECT set_config('role', 'authenticated', true);
        
        -- Try to select documents
        SELECT id, title_en, uploaded_by FROM public.documents ORDER BY uploaded_at DESC LIMIT 5;
        COMMIT;
        `
    });

    result += `IMPERSONATED ADMIN DOCS (exec_sql fallback might fail):\n${JSON.stringify(error || data, null, 2)}\n\n`;

    writeFileSync('admin_fetch_debug.txt', result);
    console.log('Done fetch debug');
})();
