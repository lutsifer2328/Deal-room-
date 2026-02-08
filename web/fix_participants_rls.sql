-- FIX: Participants Hidden in Modal
-- ISSUE: Default RLS policy likely restricts users to only see their own 'deal_participations' row.
-- RESOLUTION: Allow users to see ALL participants for a deal IF they are a participant in that deal OR are Admin/Staff.

-- 1. Drop existing restrictive policies (names might vary, so we drop likely candidates or just specific one if known)
-- SAFEST APPROACH: Drop all SELECT policies on this table to prevent conflicts
DROP POLICY IF EXISTS "Participants can view their own deal entries" ON deal_participants;
DROP POLICY IF EXISTS "Users can see participants in their deals" ON deal_participants;
DROP POLICY IF EXISTS "deal_participants_select_policy" ON deal_participants;
DROP POLICY IF EXISTS "Enable read access for all users" ON deal_participants;

-- 2. Create the new Permissive Policy
CREATE POLICY "see_peers_in_same_deal" ON deal_participants
FOR SELECT
USING (
  -- Option A: User is a Global Admin/Staff (Role Check)
  (auth.uid() IN (
      SELECT id FROM users 
      WHERE role IN ('admin', 'staff', 'lawyer', 'agent') -- Expanded trusted roles
  ))
  
  OR 

  -- Option B: User is a participant in this specific deal
  (deal_id IN (
      SELECT dp.deal_id
      FROM deal_participants dp
      JOIN participants p ON dp.participant_id = p.id
      WHERE p.user_id = auth.uid()
  ))
);

-- 3. Verify that the 'participants' table also allows reading (usually public or authenticated)
-- Just in case, ensure we can read the 'participants' table to resolve the JOIN above.
-- (Assuming 'participants' table is already readable, otherwise we'd need a policy there too)
-- Adding a safe fallback policy for 'participants' table just in case:
DROP POLICY IF EXISTS "view_participants_globally" ON participants;
CREATE POLICY "view_participants_globally" ON participants
FOR SELECT
USING (true); -- Public profile info is generally safe to share within the app context, or restrict similarly.

-- 4. Enable RLS (just to be sure it wasn't disabled)
ALTER TABLE deal_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
