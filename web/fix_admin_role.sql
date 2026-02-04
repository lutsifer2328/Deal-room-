-- Fix admin role for lutsifer@gmail.com
-- This user was accidentally set to 'buyer' when invited as a participant

-- 1. Update the auth.users table user_metadata to set role back to 'admin'
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
    raw_user_meta_data,
    '{role}',
    '"admin"'
)
WHERE email = 'lutsifer@gmail.com';

-- 2. Update the public.users table
UPDATE public.users
SET role = 'admin'
WHERE email = 'lutsifer@gmail.com';

-- 3. Verify the changes
SELECT 
    email, 
    raw_user_meta_data->>'role' as auth_role,
    (SELECT role FROM public.users WHERE users.id = auth.users.id) as public_role
FROM auth.users
WHERE email = 'lutsifer@gmail.com';
