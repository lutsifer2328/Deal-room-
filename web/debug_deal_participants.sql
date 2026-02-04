-- Deep dive into Deal Participants
-- 1. Check if ANY deal participants exist
SELECT count(*) as total_deal_participants FROM deal_participants;

-- 2. Check the most recent ones (verify if the ones you just created are there)
SELECT 
    dp.joined_at, 
    dp.role, 
    d.title as deal_title, 
    p.email as participant_email
FROM deal_participants dp
JOIN deals d ON dp.deal_id = d.id
JOIN participants p ON dp.participant_id = p.id
ORDER BY dp.joined_at DESC 
LIMIT 10;

-- 3. Check for Orphaned Deal Participants (where link exists but permission/query might fail)
SELECT * FROM deal_participants WHERE deal_id IS NULL OR participant_id IS NULL;
