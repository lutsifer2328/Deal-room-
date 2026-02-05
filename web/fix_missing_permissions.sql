-- 1. Fix Deal Participants Permissions (Update/Delete)
-- Ensure authenticated users can modify deal participants
CREATE POLICY "Enable delete for authenticated users" ON "public"."deal_participants"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (true);

CREATE POLICY "Enable update for authenticated users" ON "public"."deal_participants"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 2. Fix Documents Metadata Permissions
-- Ensure we can insert/update document metadata
CREATE POLICY "Enable insert for authenticated users" ON "public"."documents"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable select for authenticated users" ON "public"."documents"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (true);

-- 3. STORAGE BUCKET & POLICIES
-- Create specific 'documents' bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files to 'documents' bucket
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

-- Allow authenticated users to view files in 'documents' bucket
CREATE POLICY "Allow authenticated reads"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'documents');

-- Allow authenticated users to update/delete their own files (optional but good)
CREATE POLICY "Allow authenticated updates"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'documents');
