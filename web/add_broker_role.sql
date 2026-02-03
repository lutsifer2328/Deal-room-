-- -- Check current app_role enum values
SELECT 
    t.typname AS enum_name,
    e.enumlabel AS enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'app_role'
ORDER BY e.enumsortorder;

-- Add 'broker' to app_role enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON t.oid = e.enumtypid
        WHERE t.typname = 'app_role' 
        AND e.enumlabel = 'broker'
    ) THEN
        ALTER TYPE app_role ADD VALUE 'broker';
    END IF;
END $$;

-- Add 'attorney' to app_role enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON t.oid = e.enumtypid
        WHERE t.typname = 'app_role' 
        AND e.enumlabel = 'attorney'
    ) THEN
        ALTER TYPE app_role ADD VALUE 'attorney';
    END IF;
END $$;

-- Verify both were added
SELECT 
    t.typname AS enum_name,
    e.enumlabel AS enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'app_role'
ORDER BY e.enumsortorder;
