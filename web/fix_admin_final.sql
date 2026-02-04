-- FINAL FIX for Admin Profile (lutsifer@gmail.com)
-- This blocks ensures the public profile ID matches the Auth ID exactly.

BEGIN;

/* 1. Delete ALL public profiles for this email to clear mismatches */
DELETE FROM public.users 
WHERE email = 'lutsifer@gmail.com';

/* 2. Insert PRECISELY the user that exists in Auth */
INSERT INTO public.users (id, email, name, role, is_active, created_at)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'name', 'Admin User'),
    'admin'::app_role,
    true,
    created_at
FROM auth.users
WHERE email = 'lutsifer@gmail.com';

/* 3. Ensure validation */
SELECT * FROM public.users WHERE email = 'lutsifer@gmail.com';

COMMIT;
