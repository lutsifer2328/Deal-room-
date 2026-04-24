import { createClient } from '@supabase/supabase-js';

const s = createClient('https://qolozennlzllvrqmibls.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbG96ZW5ubHpsbHZycW1pYmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg1MTUyNywiZXhwIjoyMDg1NDI3NTI3fQ.3M6fxzDB9YfEFsLtxkdwNbojSHpGdgMhaCdAqIxVkSw');

const sql = `
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tasks_read_isolation ON public.tasks;
CREATE POLICY tasks_read_isolation ON public.tasks
FOR SELECT
USING (
  (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'lawyer', 'staff')))
  OR
  (EXISTS (
    SELECT 1 FROM public.deal_participants dp 
    JOIN public.participants p ON dp.participant_id = p.id
    WHERE dp.deal_id = tasks.deal_id 
      AND p.user_id = auth.uid() 
      AND dp.role = 'broker'
  ))
  OR
  (assigned_participant_id IN (SELECT id FROM public.participants WHERE user_id = auth.uid()))
  OR
  (assigned_to IN (
    SELECT role::text FROM public.deal_participants dp
    JOIN public.participants p ON dp.participant_id = p.id
    WHERE dp.deal_id = tasks.deal_id AND p.user_id = auth.uid()
  ))
  OR
  (assigned_to = (SELECT email FROM public.users WHERE id = auth.uid()))
);
`;

(async () => {
    console.log('Applying RLS migration...');
    // Note: We use execute_sql RPC if it exists, otherwise we'll have to notify the user.
    const { data, error } = await s.rpc('execute_sql', { query: sql });
    if (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
    console.log('Migration successful:', data);
})();
