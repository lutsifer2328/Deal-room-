-- =============================================================
-- PHASE2_FINAL_SECURITY_CLEANUP.sql
-- Run this to fix the "Empty Task List" issue while keeping isolation.
-- =============================================================

BEGIN;

-- 1. NUKE EXISTING POLICIES (To avoid conflicts)
-- This is critical to remove the "Public" access that was leaking data.
DROP POLICY IF EXISTS "Enable read access for all users" ON public.participants;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.tasks;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.deals;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.deal_participants;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.documents;

-- 2. PARTICIPANTS: Strictly self-read
DROP POLICY IF EXISTS participants_self_read ON public.participants;
CREATE POLICY participants_self_read ON public.participants 
FOR SELECT TO authenticated 
USING (user_id = auth.uid());

-- 3. TASKS: Strictly assigned
-- Using a EXISTS check to avoid potential subquery issues
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

-- 4. DEALS: Strictly member
DROP POLICY IF EXISTS deals_member_read ON public.deals;
CREATE POLICY deals_member_read ON public.deals 
FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.deal_participants dp
    JOIN public.participants p ON p.id = dp.participant_id
    WHERE dp.deal_id = public.deals.id
    AND p.user_id = auth.uid()
  )
);

-- 5. DOCUMENTS: Strictly assigned or released
DROP POLICY IF EXISTS docs_access ON public.documents;
CREATE POLICY docs_access ON public.documents 
FOR SELECT TO authenticated 
USING (
  uploaded_by = auth.uid()
  OR (
    status::text IN ('shared', 'released')
    AND EXISTS (
      SELECT 1 FROM public.deal_participants dp
      JOIN public.participants p ON p.id = dp.participant_id
      WHERE dp.deal_id = public.documents.deal_id
      AND p.user_id = auth.uid()
    )
  )
);

-- 6. ENSURE STAFF STILL HAS ACCESS
-- Note: is_staff() must have execute permission for authenticated role
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated;

DROP POLICY IF EXISTS tasks_staff_all ON public.tasks;
CREATE POLICY tasks_staff_all ON public.tasks FOR ALL TO authenticated USING (public.is_staff());

DROP POLICY IF EXISTS participants_staff_all ON public.participants;
CREATE POLICY participants_staff_all ON public.participants FOR ALL TO authenticated USING (public.is_staff());

DROP POLICY IF EXISTS deals_staff_all ON public.deals;
CREATE POLICY deals_staff_all ON public.deals FOR ALL TO authenticated USING (public.is_staff());

COMMIT;
