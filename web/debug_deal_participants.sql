-- Debug: Check Participants for latest deals
SELECT 
    d.title, 
    d.id as deal_id, 
    COUNT(dp.id) as participant_count 
FROM 
    deals d
LEFT JOIN 
    deal_participants dp ON d.id = dp.deal_id
GROUP BY 
    d.id, d.title
ORDER BY 
    d.created_at DESC
LIMIT 5;

-- Check specific deal participants detail
SELECT 
    dp.deal_id,
    dp.role,
    p.email,
    p.name,
    dp.params as permissions
FROM 
    deal_participants dp
JOIN 
    participants p ON dp.participant_id = p.id
ORDER BY 
    dp.joined_at DESC
LIMIT 10;
