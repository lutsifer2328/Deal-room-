const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const { writeFileSync } = require('fs');

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
    let result = '';

    // 1. Find ALL participant records with his email (case-insensitive) or name
    const { data: pAll } = await s.from('participants').select('*').ilike('email', '%tommy@imotco.bg%');
    result += `ALL PARTICIPANT RECORDS BY EMAIL:\n${JSON.stringify(pAll, null, 2)}\n\n`;

    // 2. See what deals these participant IDs are in
    if (pAll && pAll.length > 0) {
        const pIds = pAll.map(p => p.id);
        const { data: dpAll } = await s.from('deal_participants').select('id, deal_id, participant_id, role, functional_role').in('participant_id', pIds);
        result += `ALL DEAL_PARTICIPANTS FOR THOSE IDs:\n${JSON.stringify(dpAll, null, 2)}\n\n`;
    }

    writeFileSync('tommy_check_3.txt', result);
    console.log('Done 3');
})();
