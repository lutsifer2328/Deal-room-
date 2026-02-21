import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://qolozennlzllvrqmibls.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbG96ZW5ubHpsbHZycW1pYmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg1MTUyNywiZXhwIjoyMDg1NDI3NTI3fQ.3M6fxzDB9YfEFsLtxkdwNbojSHpGdgMhaCdAqIxVkSw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const { data, error } = await supabase.from('tasks').select('*').limit(1);
    if (data && data.length > 0) {
        fs.writeFileSync('scripts/tasks-schema.json', JSON.stringify(Object.keys(data[0]), null, 2));
        console.log('Schema written to scripts/tasks-schema.json');
    } else {
        console.log('No data');
    }
}

main();
