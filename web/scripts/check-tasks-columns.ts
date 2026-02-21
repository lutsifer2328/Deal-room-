import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qolozennlzllvrqmibls.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbG96ZW5ubHpsbHZycW1pYmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg1MTUyNywiZXhwIjoyMDg1NDI3NTI3fQ.3M6fxzDB9YfEFsLtxkdwNbojSHpGdgMhaCdAqIxVkSw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('🔍 checking tasks...');
    const { data, error } = await supabase.from('tasks').select('*').limit(1);

    if (data && data.length > 0) {
        const keys = Object.keys(data[0]);
        console.log('Keys matching "title":', keys.filter(k => k.includes('title')));
        console.log('Keys matching "assign":', keys.filter(k => k.includes('assign')));
        console.log('Keys matching "due":', keys.filter(k => k.includes('due')));
        console.log('All Keys:', keys);
    } else {
        console.log('No data found.');
    }
}

main();
