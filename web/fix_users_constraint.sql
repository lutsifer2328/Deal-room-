-- Robust script to drop the Foreign Key linking public.users to auth.users
-- This handles variable constraint names dynamically.

-- Enable access for anonymous users (since the frontend isn't fully using Supabase Auth yet)
-- This allows the "Add User" function to work without being logged in to Supabase.

-- Users
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.users;
CREATE POLICY "Enable all access for anon" ON public.users FOR ALL USING (true) WITH CHECK (true);

-- Participants
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.participants;
CREATE POLICY "Enable all access for anon" ON public.participants FOR ALL USING (true) WITH CHECK (true);

-- Deals
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.deals;
CREATE POLICY "Enable all access for anon" ON public.deals FOR ALL USING (true) WITH CHECK (true);

-- Tasks
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.tasks;
CREATE POLICY "Enable all access for anon" ON public.tasks FOR ALL USING (true) WITH CHECK (true);

-- Documents
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.documents;
CREATE POLICY "Enable all access for anon" ON public.documents FOR ALL USING (true) WITH CHECK (true);

-- Deal Participants
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.deal_participants;
CREATE POLICY "Enable all access for anon" ON public.deal_participants FOR ALL USING (true) WITH CHECK (true);

-- Agency Contracts
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.agency_contracts;
CREATE POLICY "Enable all access for anon" ON public.agency_contracts FOR ALL USING (true) WITH CHECK (true);

-- Standard Documents
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.standard_documents;
CREATE POLICY "Enable all access for anon" ON public.standard_documents FOR ALL USING (true) WITH CHECK (true);
