-- =============================================================
-- REFINE_RLS_POLICIES.sql
-- Direct isolation checks (bypassing helper bottleneck)
-- =============================================================

BEGIN;

-- 1. DROP POLICY
DROP POLICY IF EXISTS tasks_assignee_read ON public.tasks;

-- 2. CREATE DIRECT POLICY
-- This ensures that a participant can ONLY see tasks assigned to them
-- by checking the participants table directly within the policy.
CREATE POLICY tasks_assignee_read ON public.tasks 
FOR SELECT TO authenticated 
USING (
  assigned_participant_id IN (
    SELECT id FROM public.participants WHERE user_id = auth.uid()
  )
);

-- Ensure participants can read their own row (needed for subquery)
-- This was already in FINAL_SECURITY_FIX.sql but let's ensure it.
DROP POLICY IF EXISTS participants_self_read ON public.participants;
CREATE POLICY participants_self_read ON public.participants 
FOR SELECT TO authenticated 
USING (user_id = auth.uid());

COMMIT;
