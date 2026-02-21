const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const { writeFileSync } = require('fs');

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
    let result = '';

    // Check Auth user metadata
    const { data: { user }, error } = await s.auth.admin.getUserById('7fe10a22-b837-4fe0-a4bd-72a36f4df91b');
    result += `AUTH METADATA: ${JSON.stringify(user?.user_metadata, null, 2)}\n\n`;

    // And see the participant record
    const { data: pAll } = await s.from('participants').select('*').eq('user_id', '7fe10a22-b837-4fe0-a4bd-72a36f4df91b');
    result += `PARTICIPANT: ${JSON.stringify(pAll, null, 2)}\n\n`;

    writeFileSync('tommy_check_4.txt', result);
    console.log('Done 4');
})();
