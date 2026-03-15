-- =========================================
-- phase2_001_isolation_fix.sql
-- Enforce strict task and document isolation
-- =========================================

-- 1. DROP PERMISSIVE POLICIES
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.tasks;
DROP POLICY IF EXISTS "Allow logged-in read access" ON public.tasks;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.documents;
DROP POLICY IF EXISTS "Allow logged-in read access" ON public.documents;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.participants;
DROP POLICY IF EXISTS "Allow logged-in read access" ON public.participants;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.deal_participants;
DROP POLICY IF EXISTS "Allow logged-in read access" ON public.deal_participants;

-- 2. RE-APPLY CANONICAL POLICIES FROM MASTER SPEC

-- USERS
DROP POLICY IF EXISTS "users_staff_all" ON public.users;
CREATE POLICY users_staff_all ON public.users FOR SELECT TO authenticated USING (public.is_staff());

DROP POLICY IF EXISTS "users_self_read" ON public.users;
CREATE POLICY users_self_read ON public.users FOR SELECT TO authenticated USING (id = auth.uid());

-- PARTICIPANTS
DROP POLICY IF EXISTS "participants_staff_all" ON public.participants;
CREATE POLICY participants_staff_all ON public.participants FOR SELECT TO authenticated USING (public.is_staff());

DROP POLICY IF EXISTS "participants_self_read" ON public.participants;
CREATE POLICY participants_self_read ON public.participants FOR SELECT TO authenticated USING (user_id = auth.uid());

-- DEAL_PARTICIPANTS
DROP POLICY IF EXISTS "dp_staff_all_select" ON public.deal_participants;
CREATE POLICY dp_staff_all_select ON public.deal_participants FOR SELECT TO authenticated USING (public.is_staff());

DROP POLICY IF EXISTS "dp_member_read_same_deal" ON public.deal_participants;
CREATE POLICY dp_member_read_same_deal ON public.deal_participants FOR SELECT TO authenticated USING (public.is_deal_member(deal_id));

-- DEALS
DROP POLICY IF EXISTS "deals_staff_all" ON public.deals;
CREATE POLICY deals_staff_all ON public.deals FOR SELECT TO authenticated USING (public.is_staff());

DROP POLICY IF EXISTS "deals_member_read" ON public.deals;
CREATE POLICY deals_member_read ON public.deals FOR SELECT TO authenticated USING (public.is_deal_member(id));

-- TASKS
-- CRITICAL FIX: Participants can ONLY see tasks where assigned_participant_id matches their record
DROP POLICY IF EXISTS "tasks_staff_all" ON public.tasks;
CREATE POLICY tasks_staff_all ON public.tasks FOR SELECT TO authenticated USING (public.is_staff());

DROP POLICY IF EXISTS "tasks_assignee_read" ON public.tasks;
CREATE POLICY tasks_assignee_read ON public.tasks FOR SELECT TO authenticated USING (assigned_participant_id = public.current_participant_id());

-- DOCUMENTS
DROP POLICY IF EXISTS "documents_staff_all" ON public.documents;
CREATE POLICY documents_staff_all ON public.documents FOR SELECT TO authenticated USING (public.is_staff());

DROP POLICY IF EXISTS "documents_participant_select_limited" ON public.documents;
CREATE POLICY documents_participant_select_limited ON public.documents FOR SELECT TO authenticated USING (public.can_read_document_row(id));

-- 3. ENSURE RLS IS ENABLED (Just in case)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
