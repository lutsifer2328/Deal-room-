-- CHECK ADMIN STATUS
-- Run this in Supabase SQL Editor to verify the data exists

SELECT 
    id, 
    email, 
    role, 
    is_active, 
    created_at 
FROM public.users 
WHERE email ILIKE '%lutsifer%';

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users';
