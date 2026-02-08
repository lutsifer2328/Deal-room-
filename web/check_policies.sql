-- DIAGNOSTIC: List all policies on 'users' and 'deals' tables
-- We are looking for infinite recursion (e.g., a policy on 'users' that queries 'users').

SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check 
FROM pg_policies 
WHERE tablename IN ('users', 'deals')
ORDER BY tablename, policyname;
