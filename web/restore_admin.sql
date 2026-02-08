-- RESTORE ADMIN ACCESS SCRIPT
-- Run this in Supabase SQL Editor if you accidentally revoke your own Admin privileges.

-- 1. Replace 'YOUR_EMAIL_HERE' with your actual email address
DO $$
DECLARE
    target_email TEXT := 'YOUR_EMAIL_HERE';
BEGIN
    -- Update public.users
    UPDATE public.users
    SET 
        role = 'admin',
        is_active = true
    WHERE email = target_email;

    -- Update auth.users metadata to ensure session remains in sync
    UPDATE auth.users
    SET raw_user_meta_data = 
        COALESCE(raw_user_meta_data, '{}'::jsonb) || 
        jsonb_build_object('role', 'admin')
    WHERE email = target_email;

    RAISE NOTICE 'Admin privileges restored for %', target_email;
END $$;
