-- =========================================
-- phase1_005_storage_policies.sql
-- Lock storage.objects for documents bucket
-- Bulletproof UUID regex guards on folder names
-- Run LAST after all other Phase 1 files
-- =========================================

-- NOTE: RLS is already enabled on storage.objects by Supabase (owned by supabase_storage_admin).
-- Do NOT run ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY — it will fail with "must be owner".

-- =========================================
-- UUID regex pattern (inline in policies):
-- '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
-- This prevents ::uuid cast crashes on non-UUID folder names
-- =========================================

-- =========================================
-- SELECT (download/view)
-- =========================================

-- Staff: can read all objects in the documents bucket
create policy storage_documents_staff_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'documents'
  and public.is_staff()
);

-- Participants: can read objects only if:
--   - path is {deal_uuid}/{task_uuid}/...
--   - they are a deal member
-- Phase 1: any deal member can read objects in their deal folder.
-- Phase 2 will tighten this to check document.status + permissions.
create policy storage_documents_member_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and public.is_deal_member(((storage.foldername(name))[1])::uuid)
);

-- =========================================
-- INSERT (upload)
-- =========================================

-- Staff can upload anywhere in documents bucket
create policy storage_documents_staff_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'documents'
  and public.is_staff()
);

-- Participants can upload only into {deal_id}/{task_id}/...
-- where the task belongs to the deal AND is assigned to them
create policy storage_documents_member_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and (storage.foldername(name))[2] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and public.can_upload_to_task(
    ((storage.foldername(name))[1])::uuid,
    ((storage.foldername(name))[2])::uuid
  )
);

-- =========================================
-- UPDATE/DELETE: staff only
-- =========================================

create policy storage_documents_staff_update
on storage.objects
for update
to authenticated
using (bucket_id = 'documents' and public.is_staff())
with check (bucket_id = 'documents' and public.is_staff());

create policy storage_documents_staff_delete
on storage.objects
for delete
to authenticated
using (bucket_id = 'documents' and public.is_staff());

-- =========================================
-- VERIFICATION (run after executing)
-- =========================================
-- select policyname, cmd, roles, qual
-- from pg_policies
-- where schemaname = 'storage' and tablename = 'objects'
-- order by policyname;

-- =========================================
-- ROLLBACK (drop all Phase 1 storage policies):
-- =========================================
-- drop policy if exists storage_documents_staff_select on storage.objects;
-- drop policy if exists storage_documents_member_select on storage.objects;
-- drop policy if exists storage_documents_staff_insert on storage.objects;
-- drop policy if exists storage_documents_member_insert on storage.objects;
-- drop policy if exists storage_documents_staff_update on storage.objects;
-- drop policy if exists storage_documents_staff_delete on storage.objects;
