const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const { writeFileSync } = require('fs');

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
    let result = '';

    // Find ALL participant records with name like Tomi or Tommy
    const { data: pAll } = await s.from('participants').select('*').or('name.ilike.%tommy%,name.ilike.%tomi%');
    result += `ALL PARTICIPANTS (Tommy/Tomi):\n${JSON.stringify(pAll, null, 2)}\n\n`;

    if (pAll && pAll.length > 0) {
        const pIds = pAll.map(p => p.id);
        const { data: dpAll } = await s.from('deal_participants').select('id, deal_id, participant_id, role').in('participant_id', pIds);
        result += `THEIR DEALS:\n${JSON.stringify(dpAll, null, 2)}\n\n`;
    }

    // Find exactly which participant is in deal titled 'Lozenec'
    const { data: dAll } = await s.from('deals').select('id, title').ilike('title', '%Lozenec%');
    result += `DEALS NAMED LOZENEC:\n${JSON.stringify(dAll, null, 2)}\n\n`;

    if (dAll && dAll.length > 0) {
        const dIds = dAll.map(d => d.id);
        const { data: dpLozenec } = await s.from('deal_participants').select('*').in('deal_id', dIds);
        result += `PARTICIPANTS IN LOZENEC DEALS:\n${JSON.stringify(dpLozenec, null, 2)}\n\n`;

        if (dpLozenec && dpLozenec.length > 0) {
            const pLozenecIds = dpLozenec.map(dp => dp.participant_id);
            const { data: partLozenec } = await s.from('participants').select('*').in('id', pLozenecIds);
            result += `ACTUAL PARTICIPANTS IN LOZENEC:\n${JSON.stringify(partLozenec, null, 2)}\n\n`;
        }
    }

    writeFileSync('tommy_check_5.txt', result);
    console.log('Done 5');
})();
