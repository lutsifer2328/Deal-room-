const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const { writeFileSync } = require('fs');

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
    let result = '';

    // 1. Get tommy's Auth user ID
    const { data: u } = await s.from('users').select('id, email, role').eq('email', 'tommy@imotco.bg').single();
    result += `AUTH USER: ${JSON.stringify(u)}\n\n`;

    // 2. Look up the `participants` record by email
    const { data: p } = await s.from('participants').select('*').eq('email', 'tommy@imotco.bg');
    result += `PARTICIPANTS RECORD(S): ${JSON.stringify(p, null, 2)}\n\n`;

    // 3. Look up deals for that participant
    if (p && p.length > 0) {
        const { data: dp } = await s.from('deal_participants').select('id, deal_id, role, functional_role').eq('participant_id', p[0].id);
        result += `DEALS FOR PARTICIPANT: ${JSON.stringify(dp, null, 2)}\n`;
    }

    writeFileSync('tommy_check_2.txt', result);
    console.log('Done 2');
})();
