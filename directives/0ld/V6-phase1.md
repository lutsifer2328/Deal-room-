This version fixes the must-fix flaws:

Tasks are visible only to the assigned participant

Documents are not globally visible to everyone in the deal

Storage uploads from the browser are enforced by RLS (deal folder + task folder + assignment checks)

No anonymous access anywhere

No “authenticated can write audit logs” spam vector

Safe execution order (create helpers → add column → drop policies → enable RLS → recreate policies → storage)

MASTER BIBLE v6.0 — Phase 1: Security Foundation (DB-only)
Non-Negotiable Safety Rules

NO DROP TABLE

NO destructive migrations

Use only ALTER TABLE ... ADD COLUMN IF NOT EXISTS, DROP POLICY IF EXISTS, and CREATE POLICY.

This phase must not require frontend code changes.

If a participant sees “empty” after Phase 1: that means participants.user_id is not linked to their auth.users.id yet (invite flow incomplete). That is expected.

✅ What users will experience after Phase 1
Staff (admin/lawyer/staff)

No change: they still see all deals, all participants, all tasks, all documents, can manage everything.

External participant (buyer/seller/agent/etc.)

They will only see:

Deals they are a member of

Tasks assigned specifically to them

Documents they uploaded themselves, plus “released/shared” documents (if you use documents.status = shared/released)

They will NOT see:

Other participants’ tasks

Other participants’ private docs

Any admin-only tables (standard docs, audit logs, etc.)

Anonymous (not logged in)

Sees nothing. All requests return 401/403.

FILE 1 — phase1_001_helper_functions.sql
-- =========================================
-- phase1_001_helper_functions.sql
-- SECURITY DEFINER helper functions (no RLS recursion)
-- =========================================

-- 1) is_staff(): true if logged-in user exists in public.users and is active staff/admin/lawyer
create or replace function public.is_staff()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.is_active = true
      and u.role in ('admin','lawyer','staff')
  );
$$;

revoke all on function public.is_staff() from public;
grant execute on function public.is_staff() to postgres, service_role;

-- 2) current_participant_id(): participant row for current auth user
create or replace function public.current_participant_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select p.id
  from public.participants p
  where p.user_id = auth.uid()
  limit 1
$$;

revoke all on function public.current_participant_id() from public;
grant execute on function public.current_participant_id() to postgres, service_role;

-- 3) is_deal_member(deal_uuid): true if current user is linked as a participant in that deal
create or replace function public.is_deal_member(deal_uuid uuid)
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
  );
$$;

revoke all on function public.is_deal_member(uuid) from public;
grant execute on function public.is_deal_member(uuid) to postgres, service_role;

-- 4) can_upload_to_task(deal_uuid, task_uuid):
--    true if:
--      - staff
--      OR
--      - user is a member of the deal AND the task belongs to the deal AND task is assigned to their participant
create or replace function public.can_upload_to_task(deal_uuid uuid, task_uuid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    public.is_staff()
    OR exists (
      select 1
      from public.tasks t
      where t.id = task_uuid
        and t.deal_id = deal_uuid
        and t.assigned_participant_id = public.current_participant_id()
    );
$$;

revoke all on function public.can_upload_to_task(uuid, uuid) from public;
grant execute on function public.can_upload_to_task(uuid, uuid) to postgres, service_role;

-- 5) can_read_document_row(doc_id):
--    Participant can read if they uploaded it OR it is released/shared and they are deal member.
--    Staff can read all.
create or replace function public.can_read_document_row(doc_uuid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    public.is_staff()
    OR exists (
      select 1
      from public.documents d
      where d.id = doc_uuid
        and (
          d.uploaded_by = auth.uid()
          OR (
            d.status::text in ('shared','released')
            and public.is_deal_member(d.deal_id)
          )
        )
    );
$$;

revoke all on function public.can_read_document_row(uuid) from public;
grant execute on function public.can_read_document_row(uuid) to postgres, service_role;

-- Verification
-- select public.is_staff();
-- select public.current_participant_id();

FILE 2 — phase1_002_schema_additions.sql
-- =========================================
-- phase1_002_schema_additions.sql
-- Additive-only schema changes
-- =========================================

alter table public.tasks
  add column if not exists assigned_participant_id uuid null;

-- If you want strict FK (recommended), add it now (safe, does not delete data):
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tasks_assigned_participant_id_fkey'
  ) then
    alter table public.tasks
      add constraint tasks_assigned_participant_id_fkey
      foreign key (assigned_participant_id)
      references public.participants(id)
      on delete set null;
  end if;
end $$;

create index if not exists idx_tasks_assigned_participant_id
  on public.tasks (assigned_participant_id);

-- NOTE: Your app currently uses tasks.assigned_to (text).
-- Phase 1 does NOT change app code.
-- But for participant visibility to work securely, tasks assigned to externals must populate assigned_participant_id.
-- If assigned_participant_id is NULL, participants will not see the task. (Correct & secure.)

FILE 3 — phase1_003_drop_permissive_policies.sql
-- =========================================
-- phase1_003_drop_permissive_policies.sql
-- Remove ALL permissive/anon/public allow-all policies (safe, idempotent)
-- =========================================

-- PUBLIC TABLES
do $$
declare r record;
begin
  for r in (
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'users','participants','deal_participants','deals','tasks','documents',
        'standard_documents','audit_logs','agency_contracts','client_notes'
      )
  ) loop
    execute format('drop policy if exists %I on %I.%I;', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

-- STORAGE (documents bucket policies live on storage.objects)
do $$
declare r record;
begin
  for r in (
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
  ) loop
    execute format('drop policy if exists %I on %I.%I;', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

-- Verification:
-- select schemaname, tablename, policyname, cmd, roles, qual
-- from pg_policies
-- where schemaname in ('public','storage')
-- order by schemaname, tablename;

FILE 4 — phase1_004_rls_policies.sql
-- =========================================
-- phase1_004_rls_policies.sql
-- Enable RLS where missing + create strict policies
-- =========================================

-- 1) ENABLE RLS ON ALL CORE TABLES (safe)
alter table public.users enable row level security;
alter table public.participants enable row level security;
alter table public.deal_participants enable row level security;
alter table public.deals enable row level security;
alter table public.tasks enable row level security;
alter table public.documents enable row level security;
alter table public.standard_documents enable row level security;
alter table public.audit_logs enable row level security;
alter table public.agency_contracts enable row level security;
alter table public.client_notes enable row level security;

-- NOTE: We do NOT FORCE RLS in Phase 1 (keeps admin ops safer). You can force later.

-- =========================================
-- USERS
-- =========================================
create policy users_staff_all
on public.users
for select
to authenticated
using (public.is_staff());

create policy users_self_read
on public.users
for select
to authenticated
using (id = auth.uid());

create policy users_staff_write
on public.users
for insert
to authenticated
with check (public.is_staff());

create policy users_staff_update
on public.users
for update
to authenticated
using (public.is_staff())
with check (public.is_staff());

create policy users_staff_delete
on public.users
for delete
to authenticated
using (public.is_staff());

-- =========================================
-- PARTICIPANTS
-- =========================================
create policy participants_staff_all
on public.participants
for select
to authenticated
using (public.is_staff());

create policy participants_self_read
on public.participants
for select
to authenticated
using (user_id = auth.uid());

create policy participants_staff_write
on public.participants
for insert
to authenticated
with check (public.is_staff());

create policy participants_staff_update
on public.participants
for update
to authenticated
using (public.is_staff())
with check (public.is_staff());

create policy participants_staff_delete
on public.participants
for delete
to authenticated
using (public.is_staff());

-- =========================================
-- DEAL_PARTICIPANTS
-- Staff can manage; participants can read membership rows for their deals (so they can see who is involved)
-- =========================================
create policy dp_staff_all_select
on public.deal_participants
for select
to authenticated
using (public.is_staff());

create policy dp_member_read_same_deal
on public.deal_participants
for select
to authenticated
using (public.is_deal_member(deal_id));

create policy dp_staff_insert
on public.deal_participants
for insert
to authenticated
with check (public.is_staff());

create policy dp_staff_update
on public.deal_participants
for update
to authenticated
using (public.is_staff())
with check (public.is_staff());

create policy dp_staff_delete
on public.deal_participants
for delete
to authenticated
using (public.is_staff());

-- =========================================
-- DEALS
-- =========================================
create policy deals_staff_all
on public.deals
for select
to authenticated
using (public.is_staff());

create policy deals_member_read
on public.deals
for select
to authenticated
using (public.is_deal_member(id));

create policy deals_staff_insert
on public.deals
for insert
to authenticated
with check (public.is_staff());

create policy deals_staff_update
on public.deals
for update
to authenticated
using (public.is_staff())
with check (public.is_staff());

create policy deals_staff_delete
on public.deals
for delete
to authenticated
using (public.is_staff());

-- =========================================
-- TASKS
-- CRITICAL: participants can only see tasks assigned to them
-- =========================================
create policy tasks_staff_all
on public.tasks
for select
to authenticated
using (public.is_staff());

create policy tasks_assignee_read
on public.tasks
for select
to authenticated
using (assigned_participant_id = public.current_participant_id());

create policy tasks_staff_insert
on public.tasks
for insert
to authenticated
with check (public.is_staff());

create policy tasks_staff_update
on public.tasks
for update
to authenticated
using (public.is_staff())
with check (public.is_staff());

create policy tasks_staff_delete
on public.tasks
for delete
to authenticated
using (public.is_staff());

-- =========================================
-- DOCUMENTS
-- Participants see ONLY their uploads, plus released/shared docs in their deal
-- =========================================
create policy documents_staff_all
on public.documents
for select
to authenticated
using (public.is_staff());

create policy documents_participant_select_limited
on public.documents
for select
to authenticated
using (public.can_read_document_row(id));

-- Insert rules:
-- - Staff can insert any
-- - Participant can insert only if:
--    uploaded_by = auth.uid()
--    and can_upload_to_task(deal_id, task_id)
create policy documents_staff_insert
on public.documents
for insert
to authenticated
with check (public.is_staff());

create policy documents_participant_insert
on public.documents
for insert
to authenticated
with check (
  uploaded_by = auth.uid()
  and task_id is not null
  and public.can_upload_to_task(deal_id, task_id)
);

create policy documents_staff_update
on public.documents
for update
to authenticated
using (public.is_staff())
with check (public.is_staff());

create policy documents_staff_delete
on public.documents
for delete
to authenticated
using (public.is_staff());

-- =========================================
-- STANDARD_DOCUMENTS (internal templates/library)
-- =========================================
create policy standard_docs_staff_select
on public.standard_documents
for select
to authenticated
using (public.is_staff());

create policy standard_docs_staff_write
on public.standard_documents
for insert
to authenticated
with check (public.is_staff());

create policy standard_docs_staff_update
on public.standard_documents
for update
to authenticated
using (public.is_staff())
with check (public.is_staff());

create policy standard_docs_staff_delete
on public.standard_documents
for delete
to authenticated
using (public.is_staff());

-- =========================================
-- AUDIT_LOGS (staff read only; writes should be server-side)
-- service_role bypasses RLS anyway, so no insert policy needed for clients.
-- =========================================
create policy audit_logs_staff_select
on public.audit_logs
for select
to authenticated
using (public.is_staff());

-- No INSERT policy intentionally (prevents spam). Use service_role/server only.

-- =========================================
-- AGENCY_CONTRACTS (internal only)
-- =========================================
create policy agency_contracts_staff_all
on public.agency_contracts
for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

-- =========================================
-- CLIENT_NOTES (internal only)
-- =========================================
create policy client_notes_staff_all
on public.client_notes
for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

-- Verification
-- select tablename, policyname, cmd, roles, qual
-- from pg_policies
-- where schemaname = 'public'
-- order by tablename, policyname;

-- Verify RLS enabled:
-- select schemaname, tablename, rowsecurity
-- from pg_tables
-- where schemaname='public'
--   and tablename in ('users','participants','deal_participants','deals','tasks','documents','standard_documents','audit_logs','agency_contracts','client_notes');

FILE 5 — phase1_005_storage_policies.sql

This is the most important part because you upload from the browser using supabase.storage.from('documents').upload(...).

Your current path pattern is:

{deal_id}/{task_id}/{file}

So we enforce:

folder[1] is UUID (deal_id)

folder[2] is UUID (task_id)

user can upload only if can_upload_to_task(deal_id, task_id) is true

-- =========================================
-- phase1_005_storage_policies.sql
-- Lock storage.objects for documents bucket
-- =========================================

-- Ensure RLS is enabled on storage.objects (usually already enabled in Supabase)
alter table storage.objects enable row level security;

-- Regex UUID guard (prevents ::uuid crashes)
-- We'll inline the regex checks in policies.

-- SELECT (download/view)
-- Staff: can read all objects in the bucket
create policy storage_documents_staff_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'documents'
  and public.is_staff()
);

-- Participants: can read only if:
--  - path is deal_uuid/task_uuid/...
--  - they are deal member AND (doc is released/shared OR they uploaded it)
-- We enforce via documents table by matching storage path to documents.url if you store it,
-- BUT your schema currently stores url text and may be old public URLs.
-- So we do a minimal safe rule in Phase 1:
-- participant can read objects only if they are a member of the deal folder.
create policy storage_documents_member_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and public.is_deal_member(((storage.foldername(name))[1])::uuid)
);

-- INSERT (upload)
-- Staff can upload anywhere in documents
create policy storage_documents_staff_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'documents'
  and public.is_staff()
);

-- Participants can upload only into {deal_id}/{task_id}/... where task belongs to deal and assigned to them
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

-- UPDATE/DELETE: staff only
create policy storage_documents_staff_update
on storage.objects
for update
to authenticated
using (bucket_id='documents' and public.is_staff())
with check (bucket_id='documents' and public.is_staff());

create policy storage_documents_staff_delete
on storage.objects
for delete
to authenticated
using (bucket_id='documents' and public.is_staff());

-- Verification:
-- select policyname, cmd, roles, qual
-- from pg_policies
-- where schemaname='storage' and tablename='objects'
-- order by policyname;

Important note about storage READ rules

Right now, Phase 1 SELECT rule allows any deal member to read objects in the deal folder.
If you want true “released-only content access”, we’ll do that in Phase 2 by:

storing storage_path in documents (instead of public url)

using a SECURITY DEFINER can_read_storage_object(name) that checks document row status + permissions

optionally moving downloads behind a signed URL endpoint

But Phase 1 already makes your system not publicly accessible and prevents cross-deal access.

Verification checklist (run these after all files)
1) RLS enabled everywhere
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname='public'
  and tablename in ('users','participants','deal_participants','deals','tasks','documents','standard_documents','audit_logs','agency_contracts','client_notes');

2) No anon/public policies left on public tables
select schemaname, tablename, policyname, cmd, roles, qual
from pg_policies
where schemaname='public'
order by tablename, policyname;

3) Storage policies exist
select policyname, cmd, roles, qual
from pg_policies
where schemaname='storage' and tablename='objects'
order by policyname;

---

## PHASE 2 — WORKFLOW CORRECTNESS (Master Change Request)

### Non-Negotiable Safety Rules (Phase 2)

- Phase 2 modifies frontend code and adds API routes. No destructive DB migrations.
- "Invite Participant" ≠ "Add Participant" — these are separate operations.
- Phase 3 is BLOCKED until all Phase 2 acceptance criteria pass.

### 2a) Idempotent Invite Endpoint: POST /api/participants/invite

Server-only endpoint. Must perform ALL steps in order:

1. **Staff auth check** — reject if caller is not staff
2. **Ensure participants row** — find by email, create if missing
3. **Ensure deal_participants link** — create if missing, NEVER throw "User already in deal"
4. **Ensure auth.users account** — create via `supabaseAdmin.auth.admin.createUser` if missing
5. **Link participants.user_id** = auth_user.id — update if was NULL
6. **Send invite/resend email** — magic link or recovery link
7. **Update invitation_status** — set to 'invited' or 'resent'
8. **Return success** — ALWAYS. Never error on "already exists" scenarios.

### 2b) UI Invite Button

- Calls `POST /api/participants/invite`
- Shows success toast even when resending
- NEVER shows "User already in deal" error

### 2c) Task Assignment Wiring

- `addTask` must populate `tasks.assigned_participant_id` by matching `assigned_to` email against `participants.email`
- If no match: `assigned_participant_id = NULL` (secure — participant won't see task until linked)
- Critical for RLS `tasks_assignee_read` policy

### 2d) Audit Logging

- Client-side inserts blocked by RLS (no INSERT policy)
- `logAction` uses `POST /api/audit-log` (service_role bypass)
- `audit_logs` fetch re-enabled for staff

### 2e) Helper Function Grants (Phase 1 Hotfix)

All 5 SECURITY DEFINER helper functions must have:
```sql
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_participant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_deal_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_upload_to_task(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_read_document_row(uuid) TO authenticated;
```

### Phase 2 Acceptance Criteria (BLOCKS Phase 3)

DO NOT proceed to Phase 3 until ALL pass:

- [ ] Participant who accepts invite and sets password can log in and see their deal(s)
- [ ] Participant sees ONLY tasks where `assigned_participant_id` matches their participant row
- [ ] Participant can upload to storage path `{deal_id}/{task_id}/…` without 403
- [ ] Invite button works for both new + existing participants (resend works, no errors)
- [ ] Admin still sees all deals, tasks, participants, documents
- [ ] Audit log entries created via server-side API route
