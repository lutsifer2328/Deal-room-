-- =====================================================================
-- phase6_002_document_download_grants.sql
-- Split content access into VIEW vs DOWNLOAD.
--   - a document_grants row = the participant may VIEW the document
--   - can_download = true    = they may also DOWNLOAD (take a copy)
-- Additive & reversible.
-- =====================================================================

-- 1) Download flag on grants (default false = view-only)
alter table public.document_grants
  add column if not exists can_download boolean not null default false;

comment on column public.document_grants.can_download is
  'true = grantee may download (take a copy), not just view in-app. Default false.';

-- 2) Backfill: preserve current behaviour. Until now anyone who could view a
--    document could also download it, so existing grants keep download rights.
update public.document_grants set can_download = true where can_download = false;

-- 3) can_download_document(doc): host, uploader, or a grant WITH can_download.
create or replace function public.can_download_document(doc_uuid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.documents d
    where d.id = doc_uuid
      and (
        public.is_deal_host(d.deal_id)
        or d.uploaded_by = auth.uid()
        or (d.owner_participant_id is not null
            and d.owner_participant_id = public.current_participant_id())
        or exists (
             select 1 from public.document_grants g
             where g.document_id = d.id
               and g.participant_id = public.current_participant_id()
               and g.can_download = true
           )
      )
  );
$$;

revoke all on function public.can_download_document(uuid) from public;
grant execute on function public.can_download_document(uuid) to postgres, authenticated, service_role;

-- =====================================================================
-- ROLLBACK:
--   drop function if exists public.can_download_document(uuid);
--   alter table public.document_grants drop column if exists can_download;
-- =====================================================================
