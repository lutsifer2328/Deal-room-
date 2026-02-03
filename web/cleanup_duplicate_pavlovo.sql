-- Clean up duplicate "Pavlovo" deals
-- Keep only the oldest one (by created_at), delete the rest

-- First, delete the deal_participants relationships for duplicate deals
DELETE FROM deal_participants 
WHERE deal_id IN (
    SELECT id 
    FROM deals 
    WHERE title = 'Pavlovo' 
    AND id != (
        -- Keep the oldest deal
        SELECT id 
        FROM deals 
        WHERE title = 'Pavlovo'
        ORDER BY created_at ASC
        LIMIT 1
    )
);

-- Then delete the duplicate deals themselves
DELETE FROM deals 
WHERE title = 'Pavlovo' 
AND id != (
    -- Keep the oldest deal
    SELECT id 
    FROM deals 
    WHERE title = 'Pavlovo'
    ORDER BY created_at ASC
    LIMIT 1
);

-- Verify cleanup - should return 1
SELECT COUNT(*) as remaining_pavlovo_deals 
FROM deals 
WHERE title = 'Pavlovo';
