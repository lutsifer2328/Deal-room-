import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://qolozennlzllvrqmibls.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbG96ZW5ubHpsbHZycW1pYmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg1MTUyNywiZXhwIjoyMDg1NDI3NTI3fQ.3M6fxzDB9YfEFsLtxkdwNbojSHpGdgMhaCdAqIxVkSw');
async function run() {
  const { data: deals } = await supabase.from('deals').select('id, title, status, created_at');
  fs.writeFileSync('deals_clean_dump.json', JSON.stringify(deals, null, 2), 'utf8');
}
run();
