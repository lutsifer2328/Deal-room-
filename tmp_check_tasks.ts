import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qolozennlzllvrqmibls.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbG96ZW5ubHpsbHZycW1pYmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg1MTUyNywiZXhwIjoyMDg1NDI3NTI3fQ.3M6fxzDB9YfEFsLtxkdwNbojSHpGdgMhaCdAqIxVkSw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.rpc('get_table_info', { table_name: 'tasks' });
  if (error) {
    // If RPC doesn't exist, try direct query
    const { data: cols, error: colError } = await supabase.from('tasks').select('*').limit(1);
    if (colError) {
      console.error('Error fetching tasks sample:', colError);
    } else {
      console.log('Tasks columns:', Object.keys(cols[0] || {}));
    }
  } else {
    console.log('Tasks info:', data);
  }
}

main();
