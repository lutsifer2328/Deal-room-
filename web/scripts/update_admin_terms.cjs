const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase Client with Service Role Key
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY
);

(async () => {
    try {
        console.log('--- Starting Super Admin update ---');

        // You can change this email to target a specific user if needed.
        // We will update ALL existing admins to accept the terms immediately.
        const { data: admins, error: fetchError } = await supabaseAdmin
            .from('users')
            .select('id, email, name, role')
            .eq('role', 'admin');

        if (fetchError) throw fetchError;

        console.log(`Found ${admins.length} admins. Updating 'terms_accepted_at' to NOW().`);

        for (const admin of admins) {
            const { error: updateError } = await supabaseAdmin
                .from('users')
                .update({
                    terms_accepted_at: new Date().toISOString()
                })
                .eq('id', admin.id);

            if (updateError) {
                console.error(`Error updating admin ${admin.email}:`, updateError);
            } else {
                console.log(`✅ Admin updated successfully: ${admin.email}`);
            }
        }

        console.log('--- Super Admin update COMPLETE ---');
    } catch (err) {
        console.error('Script failed:', err);
    }
})();
