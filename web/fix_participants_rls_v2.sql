-- Fix RLS for Deal Creation Flow
-- 1. Participants Table: Allow authenticated users to insert (for new contacts) and select (to check existence).
-- 2. Deal_Participants Table: Allow authenticated users to insert (linking users to deals).

-- Enable RLS
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_participants ENABLE ROW LEVEL SECURITY;

-- Drop existing potentially blocking policies
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.participants;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON public.participants;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.participants;

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.deal_participants;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON public.deal_participants;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.deal_participants;


-- Create Permissive Policies for Participants
-- (We rely on logic to prevent unauthorized data access, but for creation we need openness)

CREATE POLICY "Enable insert for authenticated users"
ON public.participants
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable select for authenticated users"
ON public.participants
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable update for authenticated users"
ON public.participants
FOR UPDATE
TO authenticated
USING (true);


-- Create Permissive Policies for Deal Participants
CREATE POLICY "Enable insert for authenticated users"
ON public.deal_participants
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable select for authenticated users"
ON public.deal_participants
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable update for authenticated users"
ON public.deal_participants
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Enable delete for authenticated users"
ON public.deal_participants
FOR DELETE
TO authenticated
USING (true);
