-- COMPREHENSIVE FIX: Set lutsifer@gmail.com back to admin role
-- This updates BOTH auth.users metadata AND public.users table

-- Step 1: Update auth.users raw_user_meta_data to set role to 'admin'
UPDATE auth.users
SET raw_user_meta_data = 
    CASE 
        WHEN raw_user_meta_data IS NULL THEN '{"role": "admin"}'::jsonb
        ELSE jsonb_set(raw_user_meta_data, '{role}', '"admin"', true)
    END
WHERE email = 'lutsifer@gmail.com';

-- Step 2: Also update the name if needed
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(raw_user_meta_data, '{name}', '"Tommy Ignatov"', true)
WHERE email = 'lutsifer@gmail.com';

-- Step 3: Update public.users table
UPDATE public.users
SET 
    role = 'admin',
    name = 'Tommy Ignatov',
    is_active = true,
    updated_at = now()
WHERE email = 'lutsifer@gmail.com';

-- Step 4: If user doesn't exist in public.users, insert them
INSERT INTO public.users (id, email, name, role, is_active, created_at, updated_at)
SELECT 
    id,
    email,
    'Tommy Ignatov',
    'admin',
    true,
    now(),
    now()
FROM auth.users
WHERE email = 'lutsifer@gmail.com'
AND NOT EXISTS (SELECT 1 FROM public.users WHERE email = 'lutsifer@gmail.com');

-- VERIFICATION: Check both tables
SELECT 
    'auth.users' as table_name,
    email, 
    raw_user_meta_data->>'role' as role,
    raw_user_meta_data->>'name' as name
FROM auth.users
WHERE email = 'lutsifer@gmail.com'

UNION ALL

SELECT 
    'public.users' as table_name,
    email,
    role,
    name
FROM public.users
WHERE email = 'lutsifer@gmail.com';
