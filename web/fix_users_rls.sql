-- FIX RECURSION: The 'users' table has policies that query 'users', causing infinite loops.
-- We must remove these recursive policies and replace them with simple, safe ones.

-- 1. DROP ALL EXISTING POLICIES ON public.users (Clean Slate)
DROP POLICY IF EXISTS "Admins can update profiles" ON public.users;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Admins can view and update everything" ON public.users; -- The RECURSIVE culprit
DROP POLICY IF EXISTS "Allow all authenticated to read users" ON public.users;
DROP POLICY IF EXISTS "Allow logged-in read access" ON public.users;
DROP POLICY IF EXISTS "Enable all access for anon" ON public.users;
DROP POLICY IF EXISTS "Enable all access for authenticated users0" ON public.users;
DROP POLICY IF EXISTS "Enable anon insert" ON public.users;
DROP POLICY IF EXISTS "Enable anon read" ON public.users;
DROP POLICY IF EXISTS "Enable anon update" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Allow users to read own record" ON public.users; -- Potential leftover

-- 2. CREATE NON-RECURSIVE POLICIES

-- SELECT: Allow ALL authenticated users to read ALL user profiles.
-- This breaks recursion. When "Am I Admin" check runs, it hits this simple TRUE policy and returns immediately.
CREATE POLICY "Allow authenticated to read users"
ON public.users FOR SELECT TO authenticated
USING (true);

-- UPDATE: Users can update their own profile
CREATE POLICY "Allow users to update own profile"
ON public.users FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- UPDATE: Admins can update everyone
-- This contains a subquery, BUT because the SELECT policy above is "true", it is safe.
-- It will safely recurse exactly once (Query Users Table -> Hit SELECT Policy -> Return True -> Result).
CREATE POLICY "Allow admins to update users"
ON public.users FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role::text = 'admin' -- Cast to text to match either enum or string
  )
);

-- INSERT: Allow Trigger/Auth (Service Role) implicitly.
-- If we need authenticated users to insert (rare for users table, usually auth system does it), add specific policy.
-- For now, we assume user creation happens via Auth Trigger or Admin function.

-- Verify the new clean state
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'users';
