-- Check RLS policies for documents table
select
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
from
    pg_policies
where
    tablename = 'documents';
