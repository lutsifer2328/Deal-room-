-- 1. Add functional_role to participants for Dual Roles
ALTER TABLE public.participants 
ADD COLUMN IF NOT EXISTS functional_role text;

-- 2. Add requires_password_change to users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS requires_password_change boolean DEFAULT false;

-- 3. Update Role Enum to include 'bank_representative'
-- Note: modifying enums in Postgres can be tricky if used. 
-- We'll try to add it safely.
DO $$
BEGIN
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'bank_representative';
EXCEPTION
    WHEN OTHERS THEN RAISE NOTICE 'Could not add enum value (might already exist or type is different)';
END$$;
