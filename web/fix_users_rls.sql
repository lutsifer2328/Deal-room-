-- FIX: Users table RLS - Solve "User Object: NULL" authentication crash
-- 
-- PROBLEM: The client-side auth context queries `users` table to load the profile.
-- If RLS blocks the read, user = null and the app shows "Authentication Status: Unknown".
--
-- IMPORTANT: We use auth.jwt() for the admin policy to avoid RECURSION 
-- (a policy on `users` cannot query `users` again).

-- Step 1: Drop any conflicting/broken policies first
-- (Uncomment the lines below if you get "policy already exists" errors)
-- DROP POLICY IF EXISTS "Users can read own profile" ON users;
-- DROP POLICY IF EXISTS "Admins can read all users" ON users;
-- DROP POLICY IF EXISTS "Users can read their own data" ON users;
-- DROP POLICY IF EXISTS "Staff can view all users" ON users;
-- DROP POLICY IF EXISTS "users_select_own" ON users;
-- DROP POLICY IF EXISTS "users_select_admin" ON users;

-- Step 2: Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 3: Allow every authenticated user to read their OWN row (critical for login)
CREATE POLICY "users_select_own" ON users FOR SELECT
USING (id = auth.uid());

-- Step 4: Allow admins/lawyers/staff to read ALL users (uses JWT metadata, NOT a subquery on users)
CREATE POLICY "users_select_admin" ON users FOR SELECT
USING (
  (auth.jwt() ->> 'role')::text IN ('admin', 'staff', 'lawyer')
  OR
  (auth.jwt() -> 'user_metadata' ->> 'role')::text IN ('admin', 'staff', 'lawyer')
);
