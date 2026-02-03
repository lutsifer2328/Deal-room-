-- Diagnostic: Check current RLS policies on participants table
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'participants';

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'participants';

-- FIX: Add permissive INSERT policy for authenticated users
-- This allows logged-in users to create participants
DROP POLICY IF EXISTS "Allow authenticated users to insert participants" ON public.participants;

CREATE POLICY "Allow authenticated users to insert participants"
ON public.participants
FOR INSERT
TO authenticated
WITH CHECK (true);

-- FIX: Add permissive SELECT policy (so users can read participants)
DROP POLICY IF EXISTS "Allow authenticated users to select participants" ON public.participants;

CREATE POLICY "Allow authenticated users to select participants"
ON public.participants
FOR SELECT
TO authenticated
USING (true);

-- FIX: Add UPDATE policy
DROP POLICY IF EXISTS "Allow authenticated users to update participants" ON public.participants;

CREATE POLICY "Allow authenticated users to update participants"
ON public.participants
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
