
-- Change assigned_to from ENUM to TEXT to allow storing UUIDs (specific participants)
ALTER TABLE tasks 
ALTER COLUMN assigned_to TYPE text;

-- Optional: Add a comment explaining usage
COMMENT ON COLUMN tasks.assigned_to IS 'Stores either an app_role enum value OR a specific Participant UUID';
