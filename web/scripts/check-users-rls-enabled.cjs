const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
    const { data: rel } = await s.rpc('exec_sql', { sql: "SELECT relrowsecurity FROM pg_class WHERE relname = 'users';" });
    console.log('RLS Enabled:', JSON.stringify(rel));
})();
