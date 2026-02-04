-- FIX DUPLICATE USERS: Keep the correct one, delete the wrong one

-- Step 1: Identify which ID is the REAL auth user
SELECT 
    'REAL auth.users ID' as description,
    id as auth_id,
    email
FROM auth.users
WHERE email = 'lutsifer@gmail.com';

-- Step 2: Delete ONLY the public.users record that DOESN'T match auth.users
DELETE FROM public.users
WHERE email = 'lutsifer@gmail.com'
AND id NOT IN (SELECT id FROM auth.users WHERE email = 'lutsifer@gmail.com');

-- Step 3: Update the CORRECT public.users record to ensure it has admin role
UPDATE public.users
SET 
    role = 'admin',
    name = 'Tommy Ignatov',
    is_active = true
WHERE email = 'lutsifer@gmail.com';

-- Step 4: If somehow no record exists, create it
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

-- Step 5: VERIFICATION - Check that IDs match
SELECT 
    'VERIFICATION' as step,
    auth.id as auth_id,
    users.id as users_id,
    users.role,
    users.name,
    CASE 
        WHEN auth.id = users.id THEN '✅ IDs MATCH'
        ELSE '❌ IDs DONT MATCH'
    END as status
FROM auth.users auth
LEFT JOIN public.users users ON users.id = auth.id
WHERE auth.email = 'lutsifer@gmail.com';
