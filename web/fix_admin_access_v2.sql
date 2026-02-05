-- EMERGENCY FIX: Restore Admin Access & Permissions
-- Run this in Supabase SQL Editor

BEGIN;

-- 1. Ensure public.users table exists and has RLS enabled
CREATE TABLE IF NOT EXISTS public.users (
  id uuid REFERENCES auth.users NOT NULL PRIMARY KEY,
  email text,
  name text,
  role text DEFAULT 'viewer',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_login timestamptz,
  avatar_url text
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Grant Permissions to Authenticated Users (Critical for Select)
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON TABLE public.users TO authenticated;
GRANT ALL ON TABLE public.users TO service_role;

-- 3. Reset RLS Policies for Users Table
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;

-- Allow users to read their own data (Matches auth.uid())
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
-- This ensures the ID matches perfectly and Role is 'admin'
INSERT INTO public.users (id, email, name, role, is_active, created_at, updated_at)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', 'Admin User'), 
    'admin', 
    true,
    created_at,
    now()
FROM auth.users
WHERE email ILIKE '%lutsifer%'
ON CONFLICT (id) DO UPDATE
SET 
    role = 'admin', 
    is_active = true,
    updated_at = now();

-- 5. Verification Output
SELECT id, email, role, is_active FROM public.users WHERE email ILIKE '%lutsifer%';

COMMIT;
