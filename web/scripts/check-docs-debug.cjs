const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const { writeFileSync } = require('fs');

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
    let result = '';

    // Check if documents table has RLS enabled
    const { data: rlsStatus } = await s.rpc('exec_sql', { sql: "SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'documents'" });
    result += `DOCUMENTS RLS ENABLED:\n${JSON.stringify(rlsStatus, null, 2)}\n\n`;

    // Look for documents uploaded recently by Tommy
    // Tommy's user ID is 7fe10a22-b837-4fe0-a4bd-72a36f4df91b
    const { data: recentDocs } = await s.from('documents')
        .select('*')
        .order('uploaded_at', { ascending: false })
        .limit(10);

    result += `RECENT DOCUMENTS:\n${JSON.stringify(recentDocs, null, 2)}\n\n`;

    writeFileSync('docs_debug.txt', result);
    console.log('Done docs debug');
})();
