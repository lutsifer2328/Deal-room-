-- DIAGNOSTIC: Check all data for lutsifer@gmail.com

-- Check auth.users
SELECT 
    'auth.users' as source,
    id,
    email,
    raw_user_meta_data->>'role' as metadata_role,
    raw_user_meta_data->>'name' as metadata_name,
    raw_user_meta_data as full_metadata
FROM auth.users
WHERE email = 'lutsifer@gmail.com';

-- Check public.users
SELECT 
    'public.users' as source,
    id,
    email,
    role,
    name,
    is_active
FROM public.users
WHERE email = 'lutsifer@gmail.com';
