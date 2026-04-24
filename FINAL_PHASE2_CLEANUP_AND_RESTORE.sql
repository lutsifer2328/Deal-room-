-- =============================================================
-- FINAL_PHASE2_CLEANUP_AND_RESTORE.sql
-- Run this to fix ALL isolation and visibility issues once and for all.
-- =============================================================

BEGIN;

-- 1. NUKE EVERYTHING (Policies)
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('tasks', 'participants', 'deals', 'deal_participants', 'documents', 'users', 'audit_logs')) 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- 2. ROBUST HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION public.current_participant_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
STABLE
AS $$
  SELECT id FROM public.participants WHERE user_id = auth.uid() LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.current_participant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated;

-- 3. TABLES: ENABLE RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 4. POLICIES: STAFF (Global Access)
CREATE POLICY staff_all_tasks ON public.tasks FOR ALL TO authenticated USING (public.is_staff());
CREATE POLICY staff_all_participants ON public.participants FOR ALL TO authenticated USING (public.is_staff());
CREATE POLICY staff_all_deals ON public.deals FOR ALL TO authenticated USING (public.is_staff());
CREATE POLICY staff_all_dp ON public.deal_participants FOR ALL TO authenticated USING (public.is_staff());
CREATE POLICY staff_all_docs ON public.documents FOR ALL TO authenticated USING (public.is_staff());
CREATE POLICY staff_all_users ON public.users FOR ALL TO authenticated USING (public.is_staff());

-- 5. POLICIES: PARTICIPANTS (Self-Read)
CREATE POLICY participants_self_read ON public.participants 
FOR SELECT TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY users_self_read ON public.users 
FOR SELECT TO authenticated 
USING (id = auth.uid());

-- 6. POLICIES: DEAL VISIBILITY
-- Participants can see the deals they are members of
CREATE POLICY deal_member_read ON public.deals 
FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.deal_participants dp
    WHERE dp.deal_id = public.deals.id
    AND dp.participant_id = public.current_participant_id()
  )
);

CREATE POLICY dp_member_read ON public.deal_participants 
FOR SELECT TO authenticated 
USING (
  participant_id = public.current_participant_id()
);

-- 7. POLICIES: TASK ISOLATION (The Core Fix)
-- Users can see tasks assigned specifically to them
CREATE POLICY tasks_assigned_read ON public.tasks 
FOR SELECT TO authenticated 
USING (
  assigned_participant_id = public.current_participant_id()
);

-- 8. POLICIES: DOCUMENT SECURITY
CREATE POLICY documents_assigned_read ON public.documents 
FOR SELECT TO authenticated 
USING (
  uploaded_by = auth.uid()
  OR (
    status::text IN ('shared', 'released')
    AND EXISTS (
      SELECT 1 FROM public.deal_participants dp
      WHERE dp.deal_id = public.documents.deal_id
      AND dp.participant_id = public.current_participant_id()
    )
  )
);

COMMIT;
