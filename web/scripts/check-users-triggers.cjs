const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
    const { data: trig } = await s.rpc('exec_sql', { sql: "SELECT tgname, tgenabled FROM pg_trigger JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid WHERE relname = 'users';" });
    console.log('Triggers:', JSON.stringify(trig, null, 2));
})();
