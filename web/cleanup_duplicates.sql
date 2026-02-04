-- 1. Identify and Keep ONLY the user that matches Auth
-- We'll delete any public.user that DOES NOT exist in auth.users
DELETE FROM public.users
WHERE id NOT IN (SELECT id FROM auth.users);

-- 2. (Safety) Check if there are still duplicates for 'tommyignatov@yahoo.com'
-- If auth.users has multiple rows for the same email? (Should be impossible in Supabase Auth)
-- But just in case, let's look at public.users again.

/* 
   If step 1 didn't clean them up (meaning they might be linked to different auth users?),
   we manually delete the old ones for Tommy.
   Based on your data, ID '3b230174-c4fd-46a5-93f9-1f8490aa9ea4' is the NEWEST (created today).
   The others are from Feb 2nd and 3rd.
*/

DELETE FROM public.users
WHERE email = 'tommyignatov@yahoo.com'
AND id != '3b230174-c4fd-46a5-93f9-1f8490aa9ea4';

-- 3. Add Unique Constraint to prevent this mess in the future
ALTER TABLE public.users
ADD CONSTRAINT users_email_key UNIQUE (email);

-- Verify Result
SELECT * FROM public.users WHERE email = 'tommyignatov@yahoo.com';
