-- FINAL STRICT RLS FIX (v2.6)
-- 1. Grants Execute permissions on helper functions
-- 2. Wipes ALL existing storage policies (to remove conflicts)
-- 3. Re-applies Strict RLS

-- =====================================================================================
-- 0. HELPER FUNCTIONS & PERMISSIONS
-- =====================================================================================

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

GRANT EXECUTE ON FUNCTION public.is_internal TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_internal TO service_role;
GRANT EXECUTE ON FUNCTION public.try_cast_uuid TO authenticated;
GRANT EXECUTE ON FUNCTION public.try_cast_uuid TO service_role;

-- =====================================================================================
-- 1. CLEANUP (Wipe all policies to ensure no conflicts)
-- =====================================================================================

DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
    END LOOP;
    
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'documents' AND schemaname = 'public' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.documents', pol.policyname);
    END LOOP;
END $$;

-- =====================================================================================
-- 2. USERS & DEALS (Standard Strict)
-- =====================================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow users to read own record" ON public.users;
CREATE POLICY "Allow users to read own record" ON public.users FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow internal staff to read all users" ON public.users;
CREATE POLICY "Allow internal staff to read all users" ON public.users FOR SELECT TO authenticated USING ( public.is_internal() );

DROP POLICY IF EXISTS "Allow internal staff to insert deals" ON public.deals;
CREATE POLICY "Allow internal staff to insert deals" ON public.deals FOR INSERT TO authenticated WITH CHECK ( public.is_internal() );

-- =====================================================================================
-- 3. DOCUMENTS TABLE
-- =====================================================================================
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Enable update for creators/admins" ON public.documents FOR UPDATE TO authenticated USING (
    public.is_internal()
    OR uploaded_by = auth.uid()
);

-- =====================================================================================
-- 4. STORAGE ACCESS (Strict)
-- =====================================================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', FALSE) ON CONFLICT (id) DO NOTHING;

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
    RAISE NOTICE 'Strict RLS (v2.6 - Wiped & Clean) Applied.';
END $$;
