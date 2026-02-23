const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function main() {
    console.log("Testing Login as new_ui_admin@agenzia.com...");

    // Attempt standard login the exact same way the frontend does it
    const { data, error } = await client.auth.signInWithPassword({
        email: 'new_ui_admin@agenzia.com',
        password: 'password123'
    });

    if (error) {
        console.error("❌ Login Failed:", error.message);
    } else {
        console.log("✅ Login Succeeded!");
        console.log("User ID:", data.user.id);
        console.log("Role Metadata:", data.user.user_metadata.role);
        console.log("Session:", data.session ? "Active" : "None");
    }
}
main();
