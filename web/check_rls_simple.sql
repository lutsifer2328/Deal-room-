-- List Policies for Deals and Participants Tables
SELECT tablename, policyname, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename IN ('deals', 'participants', 'deal_participants')
ORDER BY tablename;
