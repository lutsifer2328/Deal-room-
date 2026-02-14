-- ACTION 1: RLS Fix for Participant View
-- Fixes the "Spinning Wheel" bug by using deal_participants bridge correctly.

-- 1. UNLOCK DEALS (The Room)
CREATE POLICY "Participants can view their own deals" ON deals FOR SELECT
USING (
  id IN (
    SELECT deal_id FROM deal_participants
    WHERE participant_id IN (
      SELECT id FROM participants WHERE user_id = auth.uid()
    )
  )
);

-- 2. UNLOCK DOCUMENTS (The Files)
CREATE POLICY "Participants can view documents in their deals" ON documents FOR SELECT
USING (
  deal_id IN (
    SELECT deal_id FROM deal_participants
    WHERE participant_id IN (
      SELECT id FROM participants WHERE user_id = auth.uid()
    )
  )
);

-- 3. UNLOCK TEAM LIST (The People)
CREATE POLICY "Participants can view deal members" ON participants FOR SELECT
USING (
  id IN (
    SELECT participant_id FROM deal_participants
    WHERE deal_id IN (
      SELECT deal_id FROM deal_participants
      WHERE participant_id IN (
        SELECT id FROM participants WHERE user_id = auth.uid()
      )
    )
  )
);
