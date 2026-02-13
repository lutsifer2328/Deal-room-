-- Check deals for price column
SELECT 'deals' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'deals' AND column_name = 'price';

-- Check tasks for documents column type
SELECT 'tasks' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tasks' AND column_name = 'documents';
