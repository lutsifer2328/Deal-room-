const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY
);

(async () => {
    try {
        console.log('--- Resetting Admin Password ---');

        // Target: lutsifer@gmail.com
        const targetId = '8f51b0ca-17ca-4b17-b40b-b19a9c28f756';
        const newPassword = 'Tommy23';

        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
            targetId,
            { password: newPassword }
        );

        if (error) {
            console.error('Failed to reset password:', error.message);
        } else {
            console.log(`✅ Password successfully reset for lutsifer@gmail.com to: ${newPassword}`);
        }

    } catch (err) {
        console.error('Script failed:', err);
    }
})();
