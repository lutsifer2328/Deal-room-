-- EMERGENCY FIX V3: Restore Admin Access & Permissions
-- Run this in Supabase SQL Editor

BEGIN;

-- 1. Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Grant Permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON TABLE public.users TO authenticated;
GRANT ALL ON TABLE public.users TO service_role;

-- 3. Reset RLS Policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.users;

-- Allow users to read their own data
CREATE POLICY "Users can view own profile"
ON public.users FOR SELECT
TO authenticated
USING (
  auth.uid() = id
);

-- Allow admins to read everything
CREATE POLICY "Admins can view all profiles"
ON public.users FOR SELECT
TO authenticated
USING (
  exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  )
);

-- Allow admins to update everything
CREATE POLICY "Admins can update profiles"
ON public.users FOR UPDATE
TO authenticated
USING (
  exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  )
);

-- 4. FORCE RESTORE ADMIN USER (Sync from auth.users)
-- REMOVED updated_at column to avoid SQL errors
INSERT INTO public.users (id, email, name, role, is_active, created_at)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', 'Admin User'), 
    'admin', 
    true,
    created_at
FROM auth.users
WHERE email ILIKE '%lutsifer%'
ON CONFLICT (id) DO UPDATE
SET 
    role = 'admin', 
    is_active = true;

-- 5. Verification Output
SELECT id, email, role, is_active FROM public.users WHERE email ILIKE '%lutsifer%';

COMMIT;
