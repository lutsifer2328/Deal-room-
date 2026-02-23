const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
    // 1. Fetch Tommy vaskov
    const { data: users } = await s.from('users').select('*');
    const target = users.find(u => u.name && u.name.includes('Tommy vaskov'));

    if (!target) return console.log('Tommy vaskov not found');
    console.log('Tommy:', target.id);

    // 2. Check deals created by Tommy
    const { data: deals, error: dealsErr } = await s.from('deals').select('id, title').eq('created_by', target.id);
    console.log('Deals created by Tommy:', deals);

    // 3. Try deleting Tommy to see exact error!
    const res = await s.auth.admin.deleteUser(target.id);
    console.log('Auth delete response:', res.error);
})();
