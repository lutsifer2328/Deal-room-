-- Fix Documents RLS Policy to ensure Admins and Deal Participants can see them
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Drop all existing select policies on documents
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'documents' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.documents', pol.policyname);
    END LOOP;
END $$;

-- 1. Create a robust SELECT policy
CREATE POLICY "documents_select_policy" ON public.documents FOR SELECT TO authenticated USING (
    -- Admin / Lawyer / Staff can see all documents
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('admin', 'staff', 'lawyer')
    )
    OR
    -- Uploader can see their own documents
    uploaded_by = auth.uid()
    OR
    -- Deal participants can see documents in their deals
    EXISTS (
        SELECT 1 FROM public.deal_participants dp
        JOIN public.participants p ON dp.participant_id = p.id
        WHERE dp.deal_id = documents.deal_id 
        AND p.user_id = auth.uid()
    )
);

-- 2. Create a robust INSERT policy
CREATE POLICY "documents_insert_policy" ON public.documents FOR INSERT TO authenticated WITH CHECK (
    uploaded_by = auth.uid() 
    AND (
        -- Admins can insert explicitly
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role IN ('admin', 'staff', 'lawyer')
        )
        OR
        -- Participants can insert into their deals
        EXISTS (
            SELECT 1 FROM public.deal_participants dp
            JOIN public.participants p ON dp.participant_id = p.id
            WHERE dp.deal_id = documents.deal_id 
            AND p.user_id = auth.uid()
        )
    )
);

-- 3. Create a robust UPDATE policy (for verifying/rejecting)
CREATE POLICY "documents_update_policy" ON public.documents FOR UPDATE TO authenticated USING (
    -- Admins / Lawyers can update (verify/reject/release)
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('admin', 'staff', 'lawyer')
    )
    OR
    -- Uploader can update their own document before it's released maybe?
    (uploaded_by = auth.uid() AND status IN ('pending', 'verified', 'rejected'))
);

-- 4. Create a robust DELETE policy
CREATE POLICY "documents_delete_policy" ON public.documents FOR DELETE TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('admin', 'lawyer')
    )
    OR
    (uploaded_by = auth.uid() AND status != 'released')
);
