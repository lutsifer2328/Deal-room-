-- =============================================================
-- DEBUG_AND_FIX_RLS.sql
-- Run this if participants still see empty task lists.
-- =============================================================

BEGIN;

-- 1. DIAGNOSTIC (See why it might be failing)
-- You can run this first separately if you want to see IDs:
-- SELECT id, user_id FROM public.participants WHERE user_id = auth.uid();

-- 2. RE-APPLY POLICY WITH EXISTS (More robust)
DROP POLICY IF EXISTS tasks_assignee_read ON public.tasks;

CREATE POLICY tasks_assignee_read ON public.tasks 
FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.participants p 
    WHERE p.id = public.tasks.assigned_participant_id 
    AND p.user_id = auth.uid()
  )
);

-- 3. ENSURE PARTICIPANTS CAN SEE THEIR OWN DEAL LINKS
-- Needed for the frontend to show the deal at all.
DROP POLICY IF EXISTS dp_member_read_same_deal ON public.deal_participants;
CREATE POLICY dp_member_read_same_deal ON public.deal_participants 
FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.participants p 
    WHERE p.id = public.deal_participants.participant_id 
    AND p.user_id = auth.uid()
  )
);

COMMIT;
