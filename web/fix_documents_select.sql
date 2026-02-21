BEGIN;

DROP POLICY IF EXISTS "documents_select_policy" ON public.documents;

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
        AND (
            -- Either the document is assigned to their task (via owner check in other policies) OR they have Full View
            (dp.permissions->>'canViewDocuments')::boolean = true
            OR 
            -- Default behavior: if no explicit permission or false, they still need to read rows to render UI metadata
            -- Note: In page.tsx we already render metadata for all deal tasks. So the DB MUST let them read the row 
            -- even if `canViewDocuments` is false! The frontend handles Content un-locking.
            true 
        )
    )
);

COMMIT;
