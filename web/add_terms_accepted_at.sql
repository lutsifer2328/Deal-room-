-- Migration: add_terms_accepted_at
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;
-- Super Admin Check: Ensure current admins have accepted
UPDATE public.users
SET terms_accepted_at = NOW()
WHERE role = 'admin'
    AND terms_accepted_at IS NULL;