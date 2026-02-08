-- EMERGENCY FIX: Disable triggers that might be causing deadlocks/loops
-- The 'sync_user_to_metadata' triggers on INSERT/UPDATE of 'users' table are suspect.
-- If they trigger themselves (update -> trigger -> update), they cause the table to lock up.

ALTER TABLE public.users DISABLE TRIGGER on_user_insert_sync_metadata;
ALTER TABLE public.users DISABLE TRIGGER on_user_update_sync_metadata;

-- Verification
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname IN ('on_user_insert_sync_metadata', 'on_user_update_sync_metadata');
-- 'O' = Origin (Enabled), 'D' = Disabled
