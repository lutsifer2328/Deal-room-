const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function auditData() {
    console.log('🔍 Starting Data Audit...');

    // 1. Fetch Data
    const { data: dps, error: dpError } = await supabase.from('deal_participants').select('id, deal_id, participant_id');
    const { data: deals, error: dError } = await supabase.from('deals').select('id');
    const { data: parts, error: pError } = await supabase.from('participants').select('id');

    if (dpError || dError || pError) {
        console.error('Error fetching data:', dpError, dError, pError);
        return;
    }

    const dealIds = new Set(deals.map(d => d.id));
    const partIds = new Set(parts.map(p => p.id));

    console.log(`Checking ${dps.length} deal_participant records...`);

    let orphansFound = 0;

    for (const dp of dps) {
        let issues = [];
        if (!dealIds.has(dp.deal_id)) {
            issues.push(`Orphan Deal ID: ${dp.deal_id}`);
        }
        if (!partIds.has(dp.participant_id)) {
            issues.push(`Orphan Participant ID: ${dp.participant_id}`);
        }

        if (issues.length > 0) {
            orphansFound++;
            console.warn(`⚠️ Issue with DP ${dp.id}: ${issues.join(', ')}`);
        }
    }

    if (orphansFound === 0) {
        console.log('✅ No orphan records found in deal_participants.');
    } else {
        console.log(`❌ Found ${orphansFound} orphan records.`);
    }

    // 2. Check for Users without Participants (Optional but good to know)
    // ...
}

auditData();
