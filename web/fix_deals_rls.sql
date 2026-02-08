-- Enable RLS
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.deals;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON public.deals;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.deals;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.deals;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.deals;

-- Create permissive policies for authenticated users for now to unblock creation
-- We can refine these later to check specific roles if needed
CREATE POLICY "Enable insert for authenticated users"
ON public.deals
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable select for authenticated users"
ON public.deals
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable update for authenticated users"
ON public.deals
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Enable delete for authenticated users"
ON public.deals
FOR DELETE
TO authenticated
USING (true);
