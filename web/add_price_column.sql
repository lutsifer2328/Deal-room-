-- Add price column to deals table
ALTER TABLE deals ADD COLUMN IF NOT EXISTS price numeric;
