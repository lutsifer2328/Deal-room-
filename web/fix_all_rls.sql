-- Comprehensive RLS fix for all tables needed by participants
-- This allows authenticated users to read the data they need to see their deals

-- ===== PARTICIPANTS TABLE =====
DROP POLICY IF EXISTS "Allow authenticated users to insert participants" ON public.participants;
DROP POLICY IF EXISTS "Allow authenticated users to select participants" ON public.participants;
DROP POLICY IF EXISTS "Allow authenticated users to update participants" ON public.participants;

CREATE POLICY "Allow authenticated users to insert participants"
ON public.participants FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to select participants"
ON public.participants FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to update participants"
ON public.participants FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ===== DEAL_PARTICIPANTS TABLE =====
DROP POLICY IF EXISTS "Allow authenticated users to select deal_participants" ON public.deal_participants;
DROP POLICY IF EXISTS "Allow authenticated users to insert deal_participants" ON public.deal_participants;

CREATE POLICY "Allow authenticated users to select deal_participants"
ON public.deal_participants FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert deal_participants"
ON public.deal_participants FOR INSERT TO authenticated WITH CHECK (true);

-- ===== DEALS TABLE =====
DROP POLICY IF EXISTS "Allow authenticated users to select deals" ON public.deals;

CREATE POLICY "Allow authenticated users to select deals"
ON public.deals FOR SELECT TO authenticated USING (true);

-- ===== USERS TABLE =====
DROP POLICY IF EXISTS "Allow users to read own record" ON public.users;
DROP POLICY IF EXISTS "Allow all authenticated to read users" ON public.users;

CREATE POLICY "Allow all authenticated to read users"
ON public.users FOR SELECT TO authenticated USING (true);

-- Verify: Check what policies exist now
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('participants', 'deal_participants', 'deals', 'users')
ORDER BY tablename, policyname;
