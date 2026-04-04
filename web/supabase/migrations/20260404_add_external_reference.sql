-- Step 1: Add column as nullable
ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS external_reference TEXT;

-- Step 2: Backfill existing rows with unique PENDING- prefix
UPDATE public.deals
SET external_reference = 'PENDING-' || SUBSTRING(id::text, 1, 8)
WHERE external_reference IS NULL;

-- VERIFICATION: Must return 0 rows before proceeding
-- SELECT id, title, external_reference FROM public.deals WHERE external_reference IS NULL;

-- Step 3: Enforce NOT NULL + UNIQUE constraints
ALTER TABLE public.deals
  ALTER COLUMN external_reference SET NOT NULL;

ALTER TABLE public.deals
  ADD CONSTRAINT deals_external_reference_unique
  UNIQUE (external_reference);

-- Rollback: ALTER TABLE public.deals DROP COLUMN IF EXISTS external_reference;
