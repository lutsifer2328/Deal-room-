
-- 1. Drop the foreign key constraint first (it requires UUIDs)
ALTER TABLE audit_logs 
DROP CONSTRAINT IF EXISTS audit_logs_actor_id_fkey;

-- 2. Change actor_id from UUID to TEXT to allow 'u_lawyer' and other string IDs
ALTER TABLE audit_logs 
ALTER COLUMN actor_id TYPE text;

-- 3. Ensure actor_name is also TEXT (just in case)
ALTER TABLE audit_logs 
ALTER COLUMN actor_name TYPE text;
