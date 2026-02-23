const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

async function main() {
    let out = "Testing identical Promise.all fetch...\n";
    const anonClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    // Login as the brand_new_admin
    const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({
        email: 'brand_new_admin@agenzia.com',
        password: 'password123'
    });

    if (authError) {
        console.error("Login Failed:", authError.message);
        return;
    }

    out += `✅ Logged in as brand_new_admin (${authData.user.id})\n`;

    try {
        const [
            usersRes, dealsRes, tasksRes, partsRes, dpsRes,
            stdDocsRes, logsRes, contractsRes, docsRes
        ] = await Promise.all([
            anonClient.from('users').select('*').order('created_at', { ascending: false }),
            anonClient.from('deals').select('*'),
            anonClient.from('tasks').select('*'),
            anonClient.from('participants').select('*'),
            anonClient.from('deal_participants').select('*'),
            anonClient.from('standard_documents').select('*'),
            anonClient.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(10),
            anonClient.from('agency_contracts').select('*'),
            anonClient.from('documents').select('*')
        ]);

        const results = {
            users: usersRes, deals: dealsRes, tasks: tasksRes, parts: partsRes,
            dps: dpsRes, stdDocs: stdDocsRes, logs: logsRes, contracts: contractsRes, docs: docsRes
        };

        let hasError = false;
        for (const [key, res] of Object.entries(results)) {
            if (res.error) {
                out += `❌ Error fetching ${key}: ${res.error.message}\n`;
                hasError = true;
            } else {
                out += `✅ Fetched ${res.data.length} ${key}\n`;
            }
        }

        if (!hasError) out += "\n🎉 Promise.all succeeded perfectly!\n";

    } catch (err) {
        out += `💥 Promise.all threw an exception: ${err.message}\n`;
    }

    fs.writeFileSync('scripts/promise-all-test.out', out, 'utf8');
}
main();
