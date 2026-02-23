const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
    const { data: triggers, error } = await s.auth.admin.listUsers();
    // wait I don't have direct access via admin api. I will just query using a small postgres edge function or raw fetch.

    // Instead of auth, I will hit postgres using the REST API to get information_schema.
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/?apikey=${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`);
    const swagger = await res.json();
    console.log("Paths:", Object.keys(swagger.paths).filter(p => !p.includes('/rpc/')));
})();
