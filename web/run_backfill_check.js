const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://qolozennlzllvrqmibls.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbG96ZW5ubHpsbHZycW1pYmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg1MTUyNywiZXhwIjoyMDg1NDI3NTI3fQ.3M6fxzDB9YfEFsLtxkdwNbojSHpGdgMhaCdAqIxVkSw";

const supabase = createClient(supabaseUrl, supabaseKey);

async function runBackfillCheck() {
    console.log('Running user requested query...');
    // We use a raw query if possible, but let's try the select first
    const { data, error } = await supabase
        .from('deals')
        .select('id, title, external_reference, deal_number')
        .is('external_reference', null)
        .order('deal_number', { ascending: true });

    if (error) {
        console.log('QUERY_ERROR_START');
        console.log(JSON.stringify(error, null, 2));
        console.log('QUERY_ERROR_END');
    } else {
        console.log('QUERY_RESULTS_START');
        console.log(JSON.stringify(data, null, 2));
        console.log('QUERY_RESULTS_END');
    }
}
runBackfillCheck();
