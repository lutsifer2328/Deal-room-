-- CLEAN SLATE RLS & SCHEMA FIX
-- 1. Add created_by to deals if missing
ALTER TABLE deals 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- 2. Drop chaotic policies
DROP POLICY IF EXISTS "Enable anon read" ON deals;
DROP POLICY IF EXISTS "Enable anon insert" ON deals;
DROP POLICY IF EXISTS "Enable anon update" ON deals;
DROP POLICY IF EXISTS "Allow authenticated users to select deals" ON deals;
DROP POLICY IF EXISTS "Allow logged-in read access" ON deals;
DROP POLICY IF EXISTS "Enable all access for anon" ON deals;
DROP POLICY IF EXISTS "Enable all access for authenticated users1" ON deals;

DROP POLICY IF EXISTS "Enable anon read" ON participants;
DROP POLICY IF EXISTS "Enable anon insert" ON participants;
DROP POLICY IF EXISTS "Enable anon update" ON participants;
DROP POLICY IF EXISTS "Allow authenticated users to insert participants" ON participants;
DROP POLICY IF EXISTS "Enable all access for authenticated users2" ON participants;
DROP POLICY IF EXISTS "Enable all access for anon" ON participants;
DROP POLICY IF EXISTS "Allow logged-in read access" ON participants;
DROP POLICY IF EXISTS "Allow authenticated users to update participants" ON participants;
DROP POLICY IF EXISTS "Allow authenticated users to select participants" ON participants;

DROP POLICY IF EXISTS "Enable anon read" ON deal_participants;
DROP POLICY IF EXISTS "Enable anon insert" ON deal_participants;
DROP POLICY IF EXISTS "Enable anon update" ON deal_participants;
DROP POLICY IF EXISTS "Enable all access for authenticated users3" ON deal_participants;
DROP POLICY IF EXISTS "Allow authenticated users to insert deal_participants" ON deal_participants;
DROP POLICY IF EXISTS "Enable all access for anon" ON deal_participants;
DROP POLICY IF EXISTS "Allow logged-in read access" ON deal_participants;
DROP POLICY IF EXISTS "Allow authenticated users to delete deal_participants" ON deal_participants;
DROP POLICY IF EXISTS "Allow authenticated users to update deal_participants" ON deal_participants;
DROP POLICY IF EXISTS "Allow authenticated users to select deal_participants" ON deal_participants;

-- 3. Create SIMPLE, WORKING Policies (Authenticated Users get access)
-- DEALS
CREATE POLICY "Authenticated users can view deals" 
ON deals FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can create deals" 
ON deals FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update/delete deals"
ON deals FOR ALL
TO authenticated
USING (true);

-- PARTICIPANTS
CREATE POLICY "Authenticated users can view participants" 
ON participants FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can manage participants" 
ON participants FOR ALL 
TO authenticated 
USING (true);

-- DEAL_PARTICIPANTS
CREATE POLICY "Authenticated users can view deal participants" 
ON deal_participants FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can manage deal participants" 
ON deal_participants FOR ALL 
TO authenticated 
USING (true);

-- 4. Enable RLS but with these permissive auth rules
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_participants ENABLE ROW LEVEL SECURITY;
