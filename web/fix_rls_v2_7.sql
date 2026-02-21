-- FINAL STRICT RLS FIX (v2.7)
-- Includes "Safe UUID Casting" + "Path Trimming" (handling leading slashes)
-- Wipes previous policies

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

GRANT EXECUTE ON FUNCTION public.is_internal TO authenticated;
GRANT EXECUTE ON FUNCTION public.try_cast_uuid TO authenticated;

-- 2. WIPE STORAGE POLICIES
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
    END LOOP;
END $$;

-- 3. DOCUMENTS TABLE
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

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

DROP POLICY IF EXISTS "Enable update for creators/admins" ON public.documents;
CREATE POLICY "Enable update for creators/admins" ON public.documents FOR UPDATE TO authenticated USING (
    public.is_internal()
    OR uploaded_by = auth.uid()
);

-- 4. STORAGE ACCESS (TRIMMED PATHS)
-- Trims leading/trailing slash before splitting to ensure deal_id is always part 1
-- name: 'deal-id/file.pdf' -> split 1 = deal-id
-- name: '/deal-id/file.pdf' -> split 1 = deal-id

INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', FALSE) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Strict upload access" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'documents' 
    AND (
        EXISTS (
            SELECT 1 FROM public.deal_participants dp
            JOIN public.participants p ON dp.participant_id = p.id
            WHERE dp.deal_id = public.try_cast_uuid(split_part(trim(both '/' from name), '/', 1))
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
            WHERE dp.deal_id = public.try_cast_uuid(split_part(trim(both '/' from name), '/', 1))
            AND p.user_id = auth.uid()
        )
        OR public.is_internal()
    )
);

DO $$
BEGIN
    RAISE NOTICE 'Strict RLS (v2.7 - Path Trimmed) Applied.';
END $$;
