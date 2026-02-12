
-- Check column type
SELECT 
    column_name, 
    data_type, 
    udt_name
FROM 
    information_schema.columns 
WHERE 
    table_name = 'tasks' 
    AND column_name = 'assigned_to';

-- Check RLS Policies
select * from pg_policies where tablename = 'tasks';
