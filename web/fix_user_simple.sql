-- SIMPLE FIX: Just ensure the record matching auth.users has admin role
-- We'll keep both records but fix the one the app actually uses

-- Step 1: Show the auth.users ID (this is what the app looks for)
SELECT 
    'Auth user ID (what app uses)' as info,
    id,
    email,
    raw_user_meta_data->>'role' as metadata_role
FROM auth.users
WHERE email = 'lutsifer@gmail.com';

-- Step 2: Update the public.users record that MATCHES this auth ID to be admin
UPDATE public.users
SET 
    role = 'admin',
    name = 'Tommy Ignatov',
    is_active = true
WHERE id = (SELECT id FROM auth.users WHERE email = 'lutsifer@gmail.com');

-- Step 3: Create the record if it doesn't exist
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
AND NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = (SELECT id FROM auth.users WHERE email = 'lutsifer@gmail.com')
);

-- Step 4: FINAL VERIFICATION
SELECT 
    'What the app will see' as info,
    users.id,
    users.email,
    users.role,
    users.name,
    'ID matches auth: ' || CASE WHEN users.id = auth.id THEN 'YES ✅' ELSE 'NO ❌' END as verification
FROM auth.users auth
JOIN public.users users ON users.id = auth.id
WHERE auth.email = 'lutsifer@gmail.com';
