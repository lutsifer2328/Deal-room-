-- 1. Make the bucket private
UPDATE storage.buckets
SET public = false
WHERE id = 'documents';
-- 2. Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
-- 3. Drop any existing permissive SELECT policies for this bucket
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Strict View Access for Documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow staff uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow deal member uploads" ON storage.objects;
-- 4. Create new strict SELECT policy relying on `documents` table and `is_deal_member`
CREATE POLICY "Strict View Access for Documents" ON storage.objects FOR
SELECT USING (
        bucket_id = 'documents'
        AND (
            owner = auth.uid() -- Fixes the upload race condition
            OR public.is_staff()
            OR EXISTS (
                SELECT 1
                FROM public.documents d
                WHERE d.url = storage.objects.name
                    AND public.is_deal_member(d.deal_id)
            )
            OR EXISTS (
                SELECT 1
                FROM public.agency_contracts c
                WHERE c.url = storage.objects.name
            )
        )
    );
-- 5. Strict INSERT policy
-- Allow authenticated users to upload, but they cannot overwrite existing files via this policy.
-- Note: Supabase storage allows overwriting if the UPSERT flag is true on the client call,
-- but the RLS INSERT policy only applies to new rows. To restrict overwriting, we don't grant UPDATE.
CREATE POLICY "Allow authenticated uploads" ON storage.objects FOR
INSERT WITH CHECK (
        bucket_id = 'documents'
        AND auth.role() = 'authenticated'
    );
-- Note: We are deliberately NOT generating an UPDATE or DELETE policy here
-- because we want to restrict file modification/deletion to Admins/Service Roles if needed,
-- or handle it via a separate flow. For now, we only need INSERT and SELECT.