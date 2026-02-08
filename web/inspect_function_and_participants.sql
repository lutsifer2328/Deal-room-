-- DIAGNOSTIC: Inspect Function and Other Tables
-- 1. Get definition of the suspicious trigger function
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'sync_user_to_metadata';

-- 2. Check policies on participants and deal_participants
SELECT tablename, policyname, cmd, roles, qual, with_check 
FROM pg_policies 
WHERE tablename IN ('participants', 'deal_participants')
ORDER BY tablename, policyname;
