const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY
);

(async () => {
    try {
        console.log('--- Generating JWT ---');
        // Let's sign in the admin user we just reset
        const { data, error } = await supabaseAdmin.auth.signInWithPassword({
            email: 'lutsifer@gmail.com',
            password: 'Tommy23'
        });

        if (error) {
            console.error('Failed to login:', error.message);
        } else {
            console.log(data.session.access_token);
        }
    } catch (err) {
        console.error('Script failed:', err);
    }
})();
