-- 1. Check Auth User
SELECT id, email, email_confirmed_at, last_sign_in_at 
FROM auth.users 
WHERE email = 'tommyignatov@yahoo.com';

-- 2. Check Public User
SELECT * 
FROM public.users 
WHERE email = 'tommyignatov@yahoo.com';

-- 3. Check RLS Policies on users table
-- If the row exists above (when you run as admin/postgres) but API returns null, it's RLS.
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'users';
