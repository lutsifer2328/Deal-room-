
SELECT 
    column_name, 
    column_default, 
    udt_name
FROM 
    information_schema.columns 
WHERE 
    table_name = 'tasks' 
    AND (column_name = 'created_at' OR column_name = 'assigned_to');
