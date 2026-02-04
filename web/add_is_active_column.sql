-- Add is_active column to deal_participants
ALTER TABLE deal_participants 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing rows to be active
UPDATE deal_participants SET is_active = true WHERE is_active IS NULL;

-- Verify it exists now
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'deal_participants' AND column_name = 'is_active';
