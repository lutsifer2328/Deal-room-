-- Security Audit Script
-- Lists all policies for key tables to verify their configuration

SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM
    pg_policies
WHERE
    tablename IN ('deals', 'participants', 'tasks', 'comments', 'documents', 'users')
ORDER BY
    tablename, policyname;
