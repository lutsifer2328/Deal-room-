import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qolozennlzllvrqmibls.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbG96ZW5ubHpsbHZycW1pYmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg1MTUyNywiZXhwIjoyMDg1NDI3NTI3fQ.3M6fxzDB9YfEFsLtxkdwNbojSHpGdgMhaCdAqIxVkSw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: users } = await supabase.from('users').select('id, email, role');
  console.log('USERS:', JSON.stringify(users, null, 2));
  
  const { data: deals } = await supabase.from('deals').select('id, title');
  console.log('DEALS Count:', deals?.length || 0);
  console.log('DEALS:', JSON.stringify(deals, null, 2));

  const { data: dealParts } = await supabase.from('deal_participants').select('*');
  console.log('DEAL PARTICIPANTS Count:', dealParts?.length || 0);
  console.log('DEAL_PARTICIPANTS:', JSON.stringify(dealParts, null, 2));
}

run();
