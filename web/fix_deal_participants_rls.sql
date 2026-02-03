-- Check current RLS policies on deal_participants
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'deal_participants';

-- FIX: Add RLS policies for deal_participants
DROP POLICY IF EXISTS "Allow authenticated users to insert deal_participants" ON public.deal_participants;
DROP POLICY IF EXISTS "Allow authenticated users to select deal_participants" ON public.deal_participants;
DROP POLICY IF EXISTS "Allow authenticated users to update deal_participants" ON public.deal_participants;
DROP POLICY IF EXISTS "Allow authenticated users to delete deal_participants" ON public.deal_participants;

CREATE POLICY "Allow authenticated users to insert deal_participants"
ON public.deal_participants
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to select deal_participants"
ON public.deal_participants
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to update deal_participants"
ON public.deal_participants
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete deal_participants"
ON public.deal_participants
FOR DELETE
TO authenticated
USING (true);
