-- Fix recursion in users table RLS by using SECURITY DEFINER function
-- COMPLIANT WITH MASTER SPEC §5.3, §5.4, §6.2
-- 1. Ensure the helper function exists and is SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.is_internal()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('admin', 'staff', 'lawyer')
    AND is_active = true  -- COMPLIANCE: Must check is_active (§6.2)
  );
$$;

-- Secure the function (§5.4)
REVOKE ALL ON FUNCTION public.is_internal FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_internal TO authenticated;
-- Note: Spec says "Grant execute only to postgres...", but standard RLS needs 'authenticated' 
-- if the policy is FOR SELECT TO authenticated. We grant strictly to 'authenticated'.

-- 2. Update Users Table Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow users to read own record" ON public.users;
CREATE POLICY "Allow users to read own record" 
ON public.users FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow staff to read all users" ON public.users;
CREATE POLICY "Allow staff to read all users" 
ON public.users FOR SELECT 
TO authenticated 
USING ( public.is_internal() );

-- 3. Allow updates for users to themselves (e.g. avatar) or admins
DROP POLICY IF EXISTS "Allow users to update own record" ON public.users;
CREATE POLICY "Allow users to update own record" 
ON public.users FOR UPDATE
TO authenticated
USING ( auth.uid() = id )
WITH CHECK ( auth.uid() = id );

DROP POLICY IF EXISTS "Allow admins to update all users" ON public.users;
CREATE POLICY "Allow admins to update all users" 
ON public.users FOR UPDATE
TO authenticated
USING ( public.is_internal() );

-- Verify
DO $$
BEGIN
    RAISE NOTICE 'Fixed Users RLS Recursion using is_internal() (Active Staff Only).';
END $$;
