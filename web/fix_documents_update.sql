BEGIN;

DROP POLICY IF EXISTS "documents_update_policy" ON public.documents;

CREATE POLICY "documents_update_policy" ON public.documents FOR UPDATE TO authenticated USING (
    -- Admins / Lawyers can update
    public.is_staff()
    OR
    -- Deal Members (like the Broker) can update documents in their deal
    public.is_deal_member(deal_id)
    OR
    -- Uploader can update their own document before it is released
    (uploaded_by = auth.uid() AND status IN ('private', 'rejected'))
) WITH CHECK (
    public.is_staff()
    OR
    public.is_deal_member(deal_id)
    OR
    (uploaded_by = auth.uid() AND status IN ('private', 'rejected', 'verified', 'released'))
);

COMMIT;
