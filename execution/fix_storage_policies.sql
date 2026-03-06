-- Safe script to recreate storage.objects policies for the documents bucket
-- First, drop the policies if they exist to prevent errors
drop policy if exists storage_documents_staff_select on storage.objects;
drop policy if exists storage_documents_member_select on storage.objects;
drop policy if exists storage_documents_staff_insert on storage.objects;
drop policy if exists storage_documents_member_insert on storage.objects;
drop policy if exists storage_documents_staff_update on storage.objects;
drop policy if exists storage_documents_staff_delete on storage.objects;
-- 1) SELECT (download/view)
create policy storage_documents_staff_select on storage.objects for
select to authenticated using (
        bucket_id = 'documents'
        and public.is_staff()
    );
create policy storage_documents_member_select on storage.objects for
select to authenticated using (
        bucket_id = 'documents'
        and (storage.foldername(name)) [1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        and public.is_deal_member(((storage.foldername(name)) [1])::uuid)
    );
-- 2) INSERT (upload)
create policy storage_documents_staff_insert on storage.objects for
insert to authenticated with check (
        bucket_id = 'documents'
        and public.is_staff()
    );
create policy storage_documents_member_insert on storage.objects for
insert to authenticated with check (
        bucket_id = 'documents'
        and (storage.foldername(name)) [1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        and (storage.foldername(name)) [2] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        and public.can_upload_to_task(
            ((storage.foldername(name)) [1])::uuid,
            ((storage.foldername(name)) [2])::uuid
        )
    );
-- 3) UPDATE/DELETE (staff only)
create policy storage_documents_staff_update on storage.objects for
update to authenticated using (
        bucket_id = 'documents'
        and public.is_staff()
    ) with check (
        bucket_id = 'documents'
        and public.is_staff()
    );
create policy storage_documents_staff_delete on storage.objects for delete to authenticated using (
    bucket_id = 'documents'
    and public.is_staff()
);