const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const { writeFileSync } = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const sRole = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
    let result = '';

    // Check storage.objects policies
    const { data: policies, error: pError } = await sRole.rpc('exec_sql', {
        sql: `
        SELECT policyname, permissive, roles, cmd, qual, with_check 
        FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects';
        `
    });

    result += `STORAGE OBJECTS POLICIES:\n${JSON.stringify(pError || policies, null, 2)}\n\n`;

    writeFileSync('storage_rls_debug.txt', result);
    console.log('Done storage rls check');
})();
