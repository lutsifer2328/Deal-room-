-- FINAL RLS FIX
-- This script fixes the "Invisible Participants" bug by allowing authenticated users to VIEW (Select) and LINK (Insert) participants.

-- 1. Enable RLS
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_participants ENABLE ROW LEVEL SECURITY;

-- 2. Drop Restrictive Policies (Reset)
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.participants;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON public.participants;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.participants;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.participants;

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.deal_participants;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON public.deal_participants;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.deal_participants;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.deal_participants;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.deal_participants;

-- 3. Create Permissive Policies (Authenticated Users Only)

-- PARTICIPANTS
CREATE POLICY "Enable insert for authenticated users"
ON public.participants FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable select for authenticated users"
ON public.participants FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable update for authenticated users"
ON public.participants FOR UPDATE TO authenticated USING (true);


-- DEAL_PARTICIPANTS
CREATE POLICY "Enable insert for authenticated users"
ON public.deal_participants FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable select for authenticated users"
ON public.deal_participants FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable update for authenticated users"
ON public.deal_participants FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Enable delete for authenticated users"
ON public.deal_participants FOR DELETE TO authenticated USING (true);

-- 4. Verify
DO $$
BEGIN
    RAISE NOTICE 'RLS Policies Updated Successfully. Refresh the webpage to see participants.';
END $$;
