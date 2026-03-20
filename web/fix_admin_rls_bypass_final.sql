-- UNIFIED ADMIN BYPASS & SECURE ACCESS
-- Run this in Supabase SQL Editor to restore full Admin visibility

BEGIN;

-- 1. Update DEALS table
DROP POLICY IF EXISTS "Admins can view all deals" ON public.deals;
CREATE POLICY "Admins can view all deals" ON public.deals FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- 2. Update PARTICIPANTS table (Global People)
-- Allow Admins full control; keep existing restrictive policies for non-admins
DROP POLICY IF EXISTS "Admins can manage all participants" ON public.participants;
CREATE POLICY "Admins can manage all participants" ON public.participants FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- 3. Update DEAL_PARTICIPANTS table (Junction)
DROP POLICY IF EXISTS "Admins can manage all deal links" ON public.deal_participants;
CREATE POLICY "Admins can manage all deal links" ON public.deal_participants FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- 4. Update TASKS table
DROP POLICY IF EXISTS "Admins can view all tasks" ON public.tasks;
CREATE POLICY "Admins can view all tasks" ON public.tasks FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- 5. Update DOCUMENTS table
DROP POLICY IF EXISTS "Admins can view all documents" ON public.documents;
CREATE POLICY "Admins can view all documents" ON public.documents FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- 6. Verification query
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('participants', 'deal_participants', 'deals', 'tasks', 'documents')
AND policyname LIKE 'Admins%';

COMMIT;
