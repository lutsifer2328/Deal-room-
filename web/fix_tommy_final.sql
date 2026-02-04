-- FINAL FIX for Tommy's Profile
-- This script guarantees 100% sync between Auth and Public tables

BEGIN;

-- 1. Delete ALL public profiles for this email (Clean slate)
DELETE FROM public.users 
WHERE email = 'tommyignatov@yahoo.com';

-- 2. Insert PRECISELY the user that exists in Auth
INSERT INTO public.users (id, email, name, role, is_active, created_at)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'name', 'Tommy Vaskov'),
    (COALESCE(raw_user_meta_data->>'role', 'staff'))::app_role,
    true,
    created_at
FROM auth.users
WHERE email = 'tommyignatov@yahoo.com';

-- 3. Ensure the Unique Constraint is there (if not already)
-- This prevents future duplicates
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_email_key'
    ) THEN
        ALTER TABLE public.users ADD CONSTRAINT users_email_key UNIQUE (email);
    END IF;
END $$;

COMMIT;

-- 4. Verification
SELECT * FROM public.users WHERE email = 'tommyignatov@yahoo.com';
