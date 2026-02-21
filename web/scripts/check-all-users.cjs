const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const { writeFileSync } = require('fs');

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
    let result = '';

    // Check all users
    const { data: users } = await s.from('users').select('id, name, email, role');
    result += `ALL USERS:\n${JSON.stringify(users, null, 2)}\n\n`;

    writeFileSync('all_users_debug.txt', result);
    console.log('Done all users');
})();
