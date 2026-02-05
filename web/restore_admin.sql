-- FIX: Restore Admin Role & Fix RLS on users table
-- Run this script in the Supabase SQL Editor

-- 1. Force Update 'lutsifer@gmail.com' to 'admin'
-- We upsert from auth.users to ensure the ID matches perfectly
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
SET role = 'admin', is_active = true;

-- 2. Force Update 'tommyignatov' to 'admin' (Backup)
INSERT INTO public.users (id, email, name, role, is_active, created_at)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', 'Tommy Admin'), 
    'admin', 
    true,
    created_at
FROM auth.users
WHERE email ILIKE '%tommyignatov%'
ON CONFLICT (id) DO UPDATE
SET role = 'admin', is_active = true;

-- 3. Fix RLS on public.users to prevent "Default to Viewer"
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile (Critical for login)
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile"
ON public.users FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy: Admins can view all profiles (Needed for User Management)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users;
CREATE POLICY "Admins can view all profiles"
ON public.users FOR SELECT
TO authenticated
USING (
  exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  )
);

-- Policy: Allow Service Role (if needed, though it bypasses RLS)
-- (Implicitly true for service_role)
