ALTER TABLE deals 
ADD COLUMN IF NOT EXISTS price NUMERIC(15, 2); -- Supports large values with cents
