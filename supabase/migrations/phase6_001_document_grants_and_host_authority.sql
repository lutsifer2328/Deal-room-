-- =====================================================================
-- phase6_001_document_grants_and_host_authority.sql
-- Implements directives/DOC_VISIBILITY_PLAN.md — Phase A
--
--  1. deal_participants.recused column (manual recuse switch)
--  2. document_grants table (per-document, per-participant content access)
--  3. Authority functions: is_recused_from_deal / is_deal_host /
--     can_open_document / can_open_storage_object
--  4. documents policies: content gated to host | uploader | grant
--  5. tasks: round-table progress — all deal members read task rows
--  6. storage.objects: content gated the same way (real backstop)
--  7. Backfill: preserve current access (grant existing docs to
--     current active participants so nothing visible disappears)
--  8. Role cleanup: stray 'user' global role -> 'viewer'
--
-- Additive & reversible. Rollback notes at the bottom.
-- =====================================================================

begin;

-- ---------------------------------------------------------------
-- 1) Manual recuse switch on deal membership
-- ---------------------------------------------------------------
alter table public.deal_participants
  add column if not exists recused boolean not null default false;

comment on column public.deal_participants.recused is
  'Manual recusal: staff member stripped of host authority on THIS deal only. Party seats (buyer/seller) auto-recuse via is_recused_from_deal().';

-- ---------------------------------------------------------------
-- 2) Per-document content grants
-- ---------------------------------------------------------------
create table if not exists public.document_grants (
  id             uuid primary key default gen_random_uuid(),
  document_id    uuid not null references public.documents(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  granted_by     uuid references public.users(id) on delete set null,
  granted_at     timestamptz not null default now(),
  unique (document_id, participant_id)
);

create index if not exists idx_document_grants_participant
  on public.document_grants (participant_id);

alter table public.document_grants enable row level security;

-- ---------------------------------------------------------------
-- 3) Authority functions (SECURITY DEFINER, locked down same as
--    the existing helpers: postgres + authenticated + service_role)
-- ---------------------------------------------------------------

-- Recused from a deal = active membership in a PARTY seat (buyer/seller)
-- or manually flagged. Agent/notary/attorney seats are professional
-- capacity and do NOT recuse (staff often act as agents for clients).
create or replace function public.is_recused_from_deal(deal_uuid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.deal_participants dp
    join public.participants p on p.id = dp.participant_id
    where dp.deal_id = deal_uuid
      and p.user_id = auth.uid()
      and dp.is_active = true
      and (dp.recused = true or dp.role::text in ('buyer','seller'))
  );
$$;

revoke all on function public.is_recused_from_deal(uuid) from public;
grant execute on function public.is_recused_from_deal(uuid) to postgres, authenticated, service_role;

-- Deal host = Agenzia staff who is NOT a party to this deal.
create or replace function public.is_deal_host(deal_uuid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.is_staff() and not public.is_recused_from_deal(deal_uuid);
$$;

revoke all on function public.is_deal_host(uuid) from public;
grant execute on function public.is_deal_host(uuid) to postgres, authenticated, service_role;

-- Content gate: host, uploader (by auth id or participant identity), or grant.
create or replace function public.can_open_document(doc_uuid uuid)
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
           )
      )
  );
$$;

revoke all on function public.can_open_document(uuid) from public;
grant execute on function public.can_open_document(uuid) to postgres, authenticated, service_role;

-- Storage variant: map an object path back to its document row.
-- (uploads store the path in documents.url; storage_path kept as fallback)
create or replace function public.can_open_storage_object(obj_name text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.documents d
    where (d.url = obj_name or d.storage_path = obj_name)
      and public.can_open_document(d.id)
  );
$$;

revoke all on function public.can_open_storage_object(text) from public;
grant execute on function public.can_open_storage_object(text) to postgres, authenticated, service_role;

-- ---------------------------------------------------------------
-- 4) document_grants policies (host manages, grantee can see own)
-- ---------------------------------------------------------------
drop policy if exists document_grants_host_all on public.document_grants;
create policy document_grants_host_all
  on public.document_grants
  for all
  to authenticated
  using ( public.is_deal_host((select d.deal_id from public.documents d where d.id = document_id)) )
  with check ( public.is_deal_host((select d.deal_id from public.documents d where d.id = document_id)) );

drop policy if exists document_grants_grantee_select on public.document_grants;
create policy document_grants_grantee_select
  on public.document_grants
  for select
  to authenticated
  using ( participant_id = public.current_participant_id() );

-- ---------------------------------------------------------------
-- 5) documents policies: replace blanket staff/member access
-- ---------------------------------------------------------------
-- OLD (verified live 2026-07-11):
--   admin_full_access_documents      ALL    is_staff()
--   participant_select_documents     SELECT any active deal member
--   documents_view_all_if_permitted  SELECT canViewAllDocuments jsonb flag
--   participant_insert_documents     INSERT member + owner=self  (KEPT)
drop policy if exists admin_full_access_documents on public.documents;
drop policy if exists participant_select_documents on public.documents;
drop policy if exists documents_view_all_if_permitted on public.documents;

create policy documents_host_all
  on public.documents
  for all
  to authenticated
  using ( public.is_deal_host(deal_id) )
  with check ( public.is_deal_host(deal_id) );

create policy documents_open_select
  on public.documents
  for select
  to authenticated
  using ( public.can_open_document(id) );

-- ---------------------------------------------------------------
-- 6) tasks: round-table progress (names + status) for all members
-- ---------------------------------------------------------------
drop policy if exists tasks_member_read on public.tasks;
create policy tasks_member_read
  on public.tasks
  for select
  to authenticated
  using ( public.is_deal_member(deal_id) );

-- ---------------------------------------------------------------
-- 7) storage.objects: gate content at the storage layer too
-- ---------------------------------------------------------------
-- OLD (verified live 2026-07-11):
--   storage_documents_member_select  SELECT any deal member on {deal_id}/ folder
--   storage_documents_staff_select   SELECT is_staff()
--   (staff insert/update/delete and member insert policies are KEPT)
drop policy if exists storage_documents_member_select on storage.objects;
drop policy if exists storage_documents_staff_select on storage.objects;

create policy storage_documents_open_select
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and (
      public.is_deal_host(((storage.foldername(name))[1])::uuid)
      or public.can_open_storage_object(name)
    )
  );

-- ---------------------------------------------------------------
-- 8) Backfill: preserve current access.
--    Today ANY active member can open ANY document in their deal, so
--    grant exactly that for EXISTING documents. New uploads after this
--    migration follow default-closed.
-- ---------------------------------------------------------------
insert into public.document_grants (document_id, participant_id, granted_by)
select d.id, dp.participant_id, null
from public.documents d
join public.deal_participants dp
  on dp.deal_id = d.deal_id and dp.is_active = true
on conflict (document_id, participant_id) do nothing;

-- ---------------------------------------------------------------
-- 9) Role cleanup: stray 'user' global role -> 'viewer' (guest)
-- ---------------------------------------------------------------
update public.users set role = 'viewer' where role::text = 'user';

commit;

-- =====================================================================
-- VERIFICATION (run after)
-- =====================================================================
-- select count(*) from public.document_grants;                          -- = docs × members backfilled
-- select policyname from pg_policies where tablename='documents';      -- host_all, open_select, participant_insert
-- select policyname from pg_policies where tablename='objects'
--   and policyname like 'storage_documents%';                          -- open_select + kept write policies
-- select proname from pg_proc where proname in
--   ('is_recused_from_deal','is_deal_host','can_open_document','can_open_storage_object');
-- select count(*) from public.users where role::text='user';           -- 0
--
-- =====================================================================
-- ROLLBACK (restores the pre-migration state exactly)
-- =====================================================================
-- begin;
-- drop policy if exists storage_documents_open_select on storage.objects;
-- create policy storage_documents_member_select on storage.objects for select to authenticated
--   using ((bucket_id='documents') and ((storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
--          and is_deal_member(((storage.foldername(name))[1])::uuid));
-- create policy storage_documents_staff_select on storage.objects for select to authenticated
--   using ((bucket_id='documents') and is_staff());
-- drop policy if exists documents_host_all on public.documents;
-- drop policy if exists documents_open_select on public.documents;
-- create policy admin_full_access_documents on public.documents for all to authenticated
--   using (is_staff()) with check (is_staff());
-- create policy participant_select_documents on public.documents for select to authenticated
--   using (exists (select 1 from deal_participants dp join participants p on p.id=dp.participant_id
--          where dp.deal_id=documents.deal_id and p.user_id=auth.uid() and dp.is_active=true));
-- create policy documents_view_all_if_permitted on public.documents for select to authenticated
--   using (exists (select 1 from deal_participants dp join participants p on p.id=dp.participant_id
--          where dp.deal_id=documents.deal_id and p.user_id=auth.uid() and dp.is_active=true
--          and ((dp.permissions->>'canViewAllDocuments')::boolean = true)));
-- drop policy if exists tasks_member_read on public.tasks;
-- drop policy if exists document_grants_host_all on public.document_grants;
-- drop policy if exists document_grants_grantee_select on public.document_grants;
-- drop table if exists public.document_grants;
-- drop function if exists public.can_open_storage_object(text);
-- drop function if exists public.can_open_document(uuid);
-- drop function if exists public.is_deal_host(uuid);
-- drop function if exists public.is_recused_from_deal(uuid);
-- alter table public.deal_participants drop column if exists recused;
-- -- (role cleanup is intentionally not auto-reverted)
-- commit;
