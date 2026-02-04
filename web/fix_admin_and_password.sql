-- COMPLETE FIX: Reset lutsifer@gmail.com to admin with new password
-- INSTRUCTIONS: Replace 'YourNewPasswordHere' with your actual desired password (keep the quotes)

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

-- Step 3: SET THE NEW PASSWORD (EDIT THIS LINE!)
UPDATE auth.users
SET 
    encrypted_password = crypt('YourNewPasswordHere', gen_salt('bf')),
    updated_at = now()
WHERE email = 'lutsifer@gmail.com';

-- Step 4: Update public.users table
UPDATE public.users
SET 
    role = 'admin',
    name = 'Tommy Ignatov',
    is_active = true
WHERE email = 'lutsifer@gmail.com';

-- Step 5: If user doesn't exist in public.users, insert them
INSERT INTO public.users (id, email, name, role, is_active, created_at)
SELECT 
    id,
    email,
    'Tommy Ignatov',
    'admin',
    true,
    now()
FROM auth.users
WHERE email = 'lutsifer@gmail.com'
AND NOT EXISTS (SELECT 1 FROM public.users WHERE email = 'lutsifer@gmail.com');

-- VERIFICATION: Check results
SELECT 
    'auth.users' as table_name,
    email, 
    raw_user_meta_data->>'role' as role,
    raw_user_meta_data->>'name' as name,
    'password updated' as password_status
FROM auth.users
WHERE email = 'lutsifer@gmail.com'

UNION ALL

SELECT 
    'public.users' as table_name,
    email,
    role::text as role,
    name,
    'N/A' as password_status
FROM public.users
WHERE email = 'lutsifer@gmail.com';
