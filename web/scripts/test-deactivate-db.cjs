const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Setup client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const s = createClient(supabaseUrl, supabaseAnonKey);

(async () => {
    // Log in as Lutsifer (Admin)
    const { data: authData, error: authError } = await s.auth.signInWithPassword({
        email: 'lutsifer2328@gmail.com',
        password: 'password123'
    });

    if (authError) {
        console.error('Login error:', authError);
        return;
    }

    console.log('Logged in as Lutsifer:', authData.session.user.id);

    // Find a test admin user (we'll fetch someone using service role just to get an ID)
    const sAdmin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { data: users, error: err } = await sAdmin.from('users').select('*');
    if (err) return console.error(err);

    const targetUrlAdmin = users.find(u => u.name && u.name.includes('Admin') && u.email !== 'lutsifer2328@gmail.com');
    if (!targetUrlAdmin) {
        console.log('No test admin to deactivate.');
        return;
    }

    console.log('Target to deactivate:', targetUrlAdmin.name, targetUrlAdmin.id);

    // Attempt the deactivate using Lutsifer's authenticated client!
    const { data, error } = await s.from('users').update({ is_active: false }).eq('id', targetUrlAdmin.id).select();

    if (error) {
        console.log('Deactivate ERROR:', error);
    } else {
        console.log('Deactivate SUCCESS data payload:', data);
    }
})();
