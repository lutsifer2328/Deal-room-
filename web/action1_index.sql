-- ACTION 1 SUPPLEMENT: Performance Index (run in Supabase SQL Editor)
-- The RLS policies were already created; this adds the missing speed index.

CREATE INDEX IF NOT EXISTS idx_deal_participants_user_deal
ON deal_participants (participant_id, deal_id);
