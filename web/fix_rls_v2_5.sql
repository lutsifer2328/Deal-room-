-- FINAL STRICT RLS FIX (v2.5)
-- Cleaned syntax, removed inline comments, robust formatting

-- 1. HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION public.is_internal()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('admin', 'staff', 'lawyer')
  );
$$;

CREATE OR REPLACE FUNCTION public.try_cast_uuid(input_text text)
RETURNS uuid
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN input_text::uuid;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;

-- 2. USERS TABLE
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow users to read own record" ON public.users;
CREATE POLICY "Allow users to read own record" ON public.users FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow internal staff to read all users" ON public.users;
CREATE POLICY "Allow internal staff to read all users" ON public.users FOR SELECT TO authenticated USING ( public.is_internal() );

-- 3. DEALS TABLE
DROP POLICY IF EXISTS "Allow internal staff to insert deals" ON public.deals;
CREATE POLICY "Allow internal staff to insert deals" ON public.deals FOR INSERT TO authenticated WITH CHECK ( public.is_internal() );

-- 4. DOCUMENTS TABLE
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- SELECT
DROP POLICY IF EXISTS "Enable select for participants and staff" ON public.documents;
CREATE POLICY "Enable select for participants and staff" ON public.documents FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.deal_participants dp
        JOIN public.participants p ON dp.participant_id = p.id
        WHERE dp.deal_id = documents.deal_id 
        AND p.user_id = auth.uid()
    )
    OR public.is_internal()
    OR uploaded_by = auth.uid()
);

-- INSERT
DROP POLICY IF EXISTS "Enable insert for participants and staff" ON public.documents;
CREATE POLICY "Enable insert for participants and staff" ON public.documents FOR INSERT TO authenticated WITH CHECK (
    uploaded_by = auth.uid()
    AND (
        EXISTS (
            SELECT 1 FROM public.deal_participants dp
            JOIN public.participants p ON dp.participant_id = p.id
            WHERE dp.deal_id = documents.deal_id 
            AND p.user_id = auth.uid()
        )
        OR public.is_internal()
    )
);

-- UPDATE
DROP POLICY IF EXISTS "Enable update for creators/admins" ON public.documents;
CREATE POLICY "Enable update for creators/admins" ON public.documents FOR UPDATE TO authenticated USING (
    public.is_internal()
    OR uploaded_by = auth.uid()
);

-- 5. STORAGE ACCESS
-- Note: 'documents' bucket must explicitly exist and be private
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', FALSE) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Strict upload access" ON storage.objects;
CREATE POLICY "Strict upload access" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'documents' 
    AND (
        EXISTS (
            SELECT 1 FROM public.deal_participants dp
            JOIN public.participants p ON dp.participant_id = p.id
            WHERE dp.deal_id = public.try_cast_uuid(split_part(name, '/', 1))
            AND p.user_id = auth.uid()
        )
        OR public.is_internal()
    )
);

DROP POLICY IF EXISTS "Strict view access" ON storage.objects;
CREATE POLICY "Strict view access" ON storage.objects FOR SELECT TO authenticated USING (
    bucket_id = 'documents'
    AND (
        EXISTS (
            SELECT 1 FROM public.deal_participants dp
            JOIN public.participants p ON dp.participant_id = p.id
            WHERE dp.deal_id = public.try_cast_uuid(split_part(name, '/', 1))
            AND p.user_id = auth.uid()
        )
        OR public.is_internal()
    )
);

DO $$
BEGIN
    RAISE NOTICE 'Strict RLS (v2.5) Applied.';
END $$;
