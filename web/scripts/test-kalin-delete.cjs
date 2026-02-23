const { createClient } = require('@supabase/supabase-js');
const http = require('http');
require('dotenv').config({ path: '.env.local' });

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
    // 1. Fetch users
    const { data: users, error } = await s.from('users').select('*');
    if (error) { console.error(error); return; }

    // Find Kalin Kalinov or Tommy vaskov
    const target = users.find(u => u.name && (u.name.toLowerCase().includes('kalin') || u.name.toLowerCase().includes('tommy vaskov')));
    if (!target) {
        console.log('No target user found to delete.');
        return;
    }

    console.log('Attempting to delete:', target.name, target.id);

    const req = http.request({
        hostname: 'localhost',
        port: 3000,
        path: `/api/users/${target.id}`,
        method: 'DELETE',
        headers: { 'x-forwarded-for': '127.0.0.1' }
    }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => console.log('Delete API Response:', res.statusCode, data));
    });
    req.on('error', e => console.error(e));
    req.end();
})();
