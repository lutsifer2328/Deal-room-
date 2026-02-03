--- Debug: Check the actual roles stored for "Ghost House" participants
SELECT 
    d.title as deal_title,
    p.name as participant_name,
    p.email as participant_email,
    dp.role as assigned_role,
    dp.permissions,
    dp.joined_at
FROM deals d
JOIN deal_participants dp ON d.id = dp.deal_id
JOIN participants p ON dp.participant_id = p.id
WHERE d.title = 'Ghost House'
ORDER BY dp.joined_at DESC;

-- Also check if there are any participants not linked to deals
SELECT 
    p.name,
    p.email,
    p.created_at,
    COUNT(dp.deal_id) as linked_deals_count
FROM participants p
LEFT JOIN deal_participants dp ON p.id = dp.participant_id
GROUP BY p.id, p.name, p.email, p.created_at
HAVING COUNT(dp.deal_id) = 0
ORDER BY p.created_at DESC
LIMIT 10;
