-- Check if participants are marked as inactive
SELECT p.email, dp.is_active as dp_active, p.updated_at
FROM deal_participants dp
JOIN participants p ON dp.participant_id = p.id
ORDER BY dp.joined_at DESC LIMIT 10;
