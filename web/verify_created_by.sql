-- Verify created_by column population for new deals
SELECT id, title, created_by, created_at FROM deals ORDER BY created_at DESC LIMIT 5;
