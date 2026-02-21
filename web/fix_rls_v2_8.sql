-- FINAL STRICT RLS FIX (v2.8)
-- Switch to using 'path_tokens' (Array) instead of string splitting for reliability
-- Explicit Grants for base tables
-- Wipes previous policies

-- 1. HELPER FUNCTIONS & GRANTS
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

-- Explicitly allow reading base tables for RLS checks (just in case)
GRANT SELECT ON public.deal_participants TO authenticated;
GRANT SELECT ON public.participants TO authenticated;

-- 2. WIPE STORAGE POLICIES
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
    END LOOP;
END $$;

-- 3. DOCUMENTS TABLE (Unchanged)
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

-- 4. STORAGE ACCESS (PATH TOKENS)
-- path_tokens is a text[] column: ['deal-uuid', 'task-uuid', 'file.pdf']
-- path_tokens[1] should be the deal-uuid

INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', FALSE) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Strict upload access" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'documents' 
    AND (
        EXISTS (
            SELECT 1 FROM public.deal_participants dp
            JOIN public.participants p ON dp.participant_id = p.id
            -- Use index 1 (1-based)
            WHERE dp.deal_id = public.try_cast_uuid(path_tokens[1])
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
            WHERE dp.deal_id = public.try_cast_uuid(path_tokens[1])
            AND p.user_id = auth.uid()
        )
        OR public.is_internal()
    )
);

DO $$
BEGIN
    RAISE NOTICE 'Strict RLS (v2.8 - Path Tokens) Applied.';
END $$;
