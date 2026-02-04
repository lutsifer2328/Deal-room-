-- Verify Active Policies
SELECT 
    tablename, 
    policyname, 
    cmd, 
    roles, 
    qual, -- The condition for USING
    with_check -- The condition for WITH CHECK
FROM pg_policies 
WHERE tablename IN ('deals', 'participants', 'deal_participants')
ORDER BY tablename, policyname;
