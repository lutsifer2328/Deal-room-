-- FINAL STRICT RLS FIX (v2.2)
-- Includes "Infinite Recursion" fix using SECURITY DEFINER function
-- 1. Helper Function: is_internal() to safely check roles without triggering RLS loops
-- 2. Users: Read Own + Read All (if internal)
-- 3. Deals: Internal Creation
-- 4. Documents & Storage: Strict Participant/Internal access

-- =====================================================================================
-- 0. HELPER FUNCTION (Anti-Recursion)
-- =====================================================================================
CREATE OR REPLACE FUNCTION public.is_internal()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER -- Bypasses RLS to read users table safely
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('admin', 'staff', 'lawyer')
  );
$$;

-- =====================================================================================
-- 1. USERS TABLE
-- =====================================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow users to read own record" ON public.users;
CREATE POLICY "Allow users to read own record" 
ON public.users FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow internal staff to read all users" ON public.users;
CREATE POLICY "Allow internal staff to read all users" 
ON public.users FOR SELECT 
TO authenticated 
USING ( public.is_internal() ); -- Uses function, no direct table recursion

-- =====================================================================================
-- 2. DEALS TABLE
-- =====================================================================================
DROP POLICY IF EXISTS "Allow internal staff to insert deals" ON public.deals;
CREATE POLICY "Allow internal staff to insert deals"
ON public.deals FOR INSERT 
TO authenticated
WITH CHECK ( public.is_internal() );

-- =====================================================================================
-- 3. DOCUMENTS TABLE (Strict Access)
-- =====================================================================================
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- SELECT
DROP POLICY IF EXISTS "Enable select for participants and staff" ON public.documents;
CREATE POLICY "Enable select for participants and staff" 
ON public.documents FOR SELECT 
TO authenticated 
USING (
    -- 1. User is a participant in the deal
    EXISTS (
        SELECT 1 FROM public.deal_participants dp
        JOIN public.participants p ON dp.participant_id = p.id
        WHERE dp.deal_id = documents.deal_id 
        AND p.user_id = auth.uid()
    )
    OR 
    -- 2. User is Internal
    public.is_internal()
    OR
    -- 3. Uploader
    uploaded_by = auth.uid()
);

-- INSERT
DROP POLICY IF EXISTS "Enable insert for participants and staff" ON public.documents;
CREATE POLICY "Enable insert for participants and staff" 
ON public.documents FOR INSERT 
TO authenticated 
WITH CHECK (
    uploaded_by = auth.uid()
    AND (
        EXISTS (
            SELECT 1 FROM public.deal_participants dp
            JOIN public.participants p ON dp.participant_id = p.id
            WHERE dp.deal_id = documents.deal_id 
            AND p.user_id = auth.uid()
        )
        OR
        public.is_internal()
    )
);

-- UPDATE
DROP POLICY IF EXISTS "Enable update for creators/admins" ON public.documents;
CREATE POLICY "Enable update for creators/admins" 
ON public.documents FOR UPDATE 
TO authenticated 
USING (
    public.is_internal()
    OR uploaded_by = auth.uid()
);

-- =====================================================================================
-- 4. STORAGE ACCESS
-- =====================================================================================
DROP POLICY IF EXISTS "Strict upload access" ON storage.objects;
CREATE POLICY "Strict upload access"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'documents' 
    AND (
        -- Valid Deal Participant
        EXISTS (
            SELECT 1 FROM public.deal_participants dp
            JOIN public.participants p ON dp.participant_id = p.id
            WHERE dp.deal_id = (split_part(name, '/', 1)::uuid)
            AND p.user_id = auth.uid()
        )
        OR
        public.is_internal()
    )
);

DROP POLICY IF EXISTS "Strict view access" ON storage.objects;
CREATE POLICY "Strict view access"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'documents'
    AND (
        EXISTS (
            SELECT 1 FROM public.deal_participants dp
            JOIN public.participants p ON dp.participant_id = p.id
            WHERE dp.deal_id = (split_part(name, '/', 1)::uuid)
            AND p.user_id = auth.uid()
        )
        OR
        public.is_internal()
    )
);

-- Verify
DO $$
BEGIN
    RAISE NOTICE 'Strict RLS (v2.2 - No Recursion) Applied.';
END $$;
