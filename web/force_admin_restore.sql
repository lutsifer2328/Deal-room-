-- NUCLEAR RESTORE: Disable RLS -> Insert -> Enable RLS
-- This bypasses ALL permission checks to guarantee the row is created.

BEGIN;

-- 1. Temporarily Disable RLS (The "Nuclear" Button)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 2. Force Insert/Update
INSERT INTO public.users (id, email, name, role, is_active)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', 'Admin User'), 
    'admin', 
    true
FROM auth.users
WHERE email ILIKE '%lutsifer%'
ON CONFLICT (id) DO UPDATE
SET 
    role = 'admin', 
    is_active = true;

-- 3. Verify it exists (while RLS is off, so we definitely see it)
SELECT id, email, role FROM public.users WHERE email ILIKE '%lutsifer%';

-- 4. Re-Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 5. Re-Apply Critical Permissions (Just to be safe)
GRANT ALL ON TABLE public.users TO authenticated;
GRANT ALL ON TABLE public.users TO service_role;

-- 6. Ensure Policy Exists
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile"
ON public.users FOR SELECT
TO authenticated
USING (
  auth.uid() = id
);

CREATE POLICY "Admins can view and update everything"
ON public.users FOR ALL
TO authenticated
USING (
  -- Check if the user is an admin by looking up the row itself (recursion safe-ish if careful, or use auth.jwt() CLAIM if available, but here we query table)
  -- Safer to just trust the ID match for now, or a specific lookup
  auth.uid() = id OR 
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

COMMIT;
