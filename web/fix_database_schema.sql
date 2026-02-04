
DO $$
BEGIN
    -- 1. Add 'bank_representative' to app_role enum
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'bank_representative' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')) THEN
        ALTER TYPE app_role ADD VALUE 'bank_representative';
    END IF;

    -- 2. Add 'requires_password_change' column to users table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'requires_password_change') THEN
        ALTER TABLE public.users ADD COLUMN requires_password_change BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

/* Verify changes */
SELECT 
    'Enum Values' as check_type,
    enumlabel as value
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')

UNION ALL

SELECT 
    'Column Check' as check_type,
    column_name || ' (' || data_type || ')' as value
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'requires_password_change';
