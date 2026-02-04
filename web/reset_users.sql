-- Bulk Delete Users Script
-- Use this to clear out test users so you can "start fresh".
-- WARNING: This deletes users from both auth.users and public.users.

-- 1. Create a function to allow deletion if not exists (usually not needed if we run as postgres/superuser role in editor)
-- But running direct delete on auth.users is simpler.

-- Replace 'YOUR_EMAIL@EXAMPLE.COM' with the email you want to KEEP.
-- If you want to keep multiple, use IN ('email1', 'email2')

DO $$
DECLARE
    target_email TEXT := 'lutsifer@gmail.com'; -- <--- Auto-filled from your seed config
BEGIN
    -- Check safety
    IF target_email = 'YOUR_EMAIL_HERE' THEN
        RAISE EXCEPTION 'Please update the target_email variable to YOUR email address so you dont delete yourself!';
    END IF;

    -- Delete from public.users (will cascade to participants usually if FK set, but let's be safe)
    -- Actually, auth.users is the master.
    
    -- Delete from auth.users where email IS NOT the target
    -- Note: You need permissions to delete from auth.users. 
    -- If this script fails due to permissions, you might need to use the Delete button in UI or run this as Superuser.
    
    DELETE FROM auth.users 
    WHERE email != target_email;

    RAISE NOTICE 'Deleted all users except %', target_email;
END $$;
