-- Fix missing column in standard_documents

DO $$
BEGIN
    -- Add updated_at column if it does not exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'standard_documents' AND column_name = 'updated_at') THEN
        ALTER TABLE public.standard_documents 
        ADD COLUMN updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL;
    END IF;
END $$;

-- Verify the column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'standard_documents' AND column_name = 'updated_at';
