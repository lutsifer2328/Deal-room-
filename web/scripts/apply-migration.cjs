const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
    const sql = fs.readFileSync('../supabase/migrations/phase2_002_fix_trigger.sql', 'utf8');
    const { data, error } = await s.rpc('exec_sql', { sql });
    if (error) {
        console.error('Migration failed:', error);
    } else {
        console.log('Migration successful:', data);
    }
})();
