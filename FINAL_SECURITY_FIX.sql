-- =============================================================
-- FINAL_SECURITY_FIX.sql
-- Run this in the Supabase SQL Editor to ENFORCE RLS isolation.
-- This script:
-- 1. Enables RLS on all core tables.
-- 2. Drops all legacy/permissive policies.
-- 3. Creates strict role-based policies as per Master Spec.
-- =============================================================

BEGIN;

-- 1. ENABLE RLS (Essential)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- 2. DROP PERMISSIVE POLICIES (Cleaning up "Enable all access" or "Allow logged-in")
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.tasks;
DROP POLICY IF EXISTS "Allow logged-in read access" ON public.tasks;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.documents;
DROP POLICY IF EXISTS "Allow logged-in read access" ON public.documents;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.participants;
DROP POLICY IF EXISTS "Allow logged-in read access" ON public.participants;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.deal_participants;
DROP POLICY IF EXISTS "Allow logged-in read access" ON public.deal_participants;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.deals;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.deals;

-- 3. RE-APPLY STRICT POLICIES

-- USERS
CREATE POLICY users_staff_all ON public.users FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY users_self_read ON public.users FOR SELECT TO authenticated USING (id = auth.uid());

-- PARTICIPANTS
CREATE POLICY participants_staff_all ON public.participants FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY participants_self_read ON public.participants FOR SELECT TO authenticated USING (user_id = auth.uid());

-- DEAL_PARTICIPANTS
CREATE POLICY dp_staff_all_select ON public.deal_participants FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY dp_member_read_same_deal ON public.deal_participants FOR SELECT TO authenticated USING (public.is_deal_member(deal_id));

-- DEALS
CREATE POLICY deals_staff_all ON public.deals FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY deals_member_read ON public.deals FOR SELECT TO authenticated USING (public.is_deal_member(id));

-- TASKS
-- CRITICAL FIX: Participants can ONLY see tasks where assigned_participant_id matches their record
CREATE POLICY tasks_staff_all ON public.tasks FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY tasks_assignee_read ON public.tasks FOR SELECT TO authenticated USING (assigned_participant_id = public.current_participant_id());

-- DOCUMENTS
CREATE POLICY documents_staff_all ON public.documents FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY documents_participant_select_limited ON public.documents FOR SELECT TO authenticated USING (public.can_read_document_row(id));

COMMIT;
