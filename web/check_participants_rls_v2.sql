-- Check RLS Policies on Participants and Deal Participants

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
WHERE tablename IN ('participants', 'deal_participants');

-- Check if rows exist but are hidden (count total vs specific user view potentially)
SELECT count(*) as total_participants FROM participants;
SELECT count(*) as total_deal_participants FROM deal_participants;

-- Check exact data for a known deal (replace UUID if you have one, or just dump last 5)
SELECT * FROM deal_participants ORDER BY joined_at DESC LIMIT 5;
SELECT * FROM participants ORDER BY created_at DESC LIMIT 5;

-- Check Deals policies and structure
SELECT * FROM pg_policies WHERE tablename = 'deals';
-- Check if deals has created_by column
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'deals';
