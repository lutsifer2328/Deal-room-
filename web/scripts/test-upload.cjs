const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;

// Create admin client which bypasses RLS
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

// Create anon client (which would run with RLS)
const supabaseAnon = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkUploading() {
    console.log("Fetching first user...");
    const { data: users, error: err } = await supabaseAdmin.from('users').select('*').limit(1);
    console.log("Users:", users);

    console.log("Checking storage policies from pg_policies...");
    const { data: qData, error: qErr } = await supabaseAdmin.rpc('execute_sql', {
        query: `
            SELECT policyname, roles, cmd, qual, with_check 
            FROM pg_policies 
            WHERE schemaname = 'storage' AND tablename = 'objects';
        `
    });

    if (qErr) {
        console.log("Couldn't check pg_policies (no execute_sql available)");
    } else {
        console.log("Storage policies:", qData);
    }
}

checkUploading();
