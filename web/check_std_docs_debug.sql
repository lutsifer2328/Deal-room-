
-- Check is_active column and RLS
SELECT id, name, is_active FROM standard_documents LIMIT 10;

select * from pg_policies where tablename = 'standard_documents';
