ALTER TABLE audit_logs 
DROP CONSTRAINT IF EXISTS audit_logs_actor_id_fkey;

ALTER TABLE audit_logs 
ADD CONSTRAINT audit_logs_actor_id_fkey 
FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE participants
DROP CONSTRAINT IF EXISTS participants_user_id_fkey;

ALTER TABLE participants
ADD CONSTRAINT participants_user_id_fkey
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE deal_participants
DROP CONSTRAINT IF EXISTS deal_participants_participant_id_fkey;

ALTER TABLE deal_participants
ADD CONSTRAINT deal_participants_participant_id_fkey
FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE;
