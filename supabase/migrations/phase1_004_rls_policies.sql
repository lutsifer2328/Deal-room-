-- =========================================
-- phase1_004_rls_policies.sql
-- Enable RLS where missing + create strict role-based policies
-- Run AFTER phase1_003 (all old policies dropped)
-- =========================================

-- 1) ENABLE RLS ON ALL CORE TABLES (safe, idempotent)
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
-- Staff can read all users. Self can read own row.
-- Only staff can write/update/delete.
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
-- Staff can read/manage all. Self can read own record.
-- Only staff can create/update/delete.
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
-- Staff can manage. Participants can read membership rows for their deals.
-- Only staff can create/update/delete.
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
-- Staff can manage all. Participants can read only deals they are members of.
-- Only staff can create/update/delete.
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
-- CRITICAL: participants can ONLY see tasks assigned to them (via assigned_participant_id)
-- Only staff can create/update/delete tasks.
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
-- Participants see ONLY their uploads + released/shared docs in their deal.
-- Staff sees all. Participants cannot approve/reject/delete.
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
-- Staff can insert any document
create policy documents_staff_insert
on public.documents
for insert
to authenticated
with check (public.is_staff());

-- Participant can insert only if:
--   uploaded_by = auth.uid()
--   and can_upload_to_task(deal_id, task_id)
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
-- STANDARD_DOCUMENTS (internal templates/library — staff only)
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
-- AUDIT_LOGS (staff read only; no client insert to prevent spam)
-- service_role bypasses RLS, so server-side inserts still work.
-- =========================================
create policy audit_logs_staff_select
on public.audit_logs
for select
to authenticated
using (public.is_staff());

-- No INSERT policy intentionally (prevents spam). Use service_role/server only.

-- =========================================
-- AGENCY_CONTRACTS (internal only — staff only)
-- =========================================
create policy agency_contracts_staff_all
on public.agency_contracts
for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

-- =========================================
-- CLIENT_NOTES (internal only — staff only)
-- =========================================
create policy client_notes_staff_all
on public.client_notes
for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

-- =========================================
-- VERIFICATION (run after executing)
-- =========================================
-- 1) Verify all policies created:
-- select tablename, policyname, cmd, roles, qual
-- from pg_policies
-- where schemaname = 'public'
-- order by tablename, policyname;

-- 2) Verify RLS enabled on all tables:
-- select schemaname, tablename, rowsecurity
-- from pg_tables
-- where schemaname='public'
--   and tablename in ('users','participants','deal_participants','deals','tasks','documents','standard_documents','audit_logs','agency_contracts','client_notes');

-- =========================================
-- ROLLBACK (drop all Phase 1 policies):
-- =========================================
-- drop policy if exists users_staff_all on public.users;
-- drop policy if exists users_self_read on public.users;
-- drop policy if exists users_staff_write on public.users;
-- drop policy if exists users_staff_update on public.users;
-- drop policy if exists users_staff_delete on public.users;
-- drop policy if exists participants_staff_all on public.participants;
-- drop policy if exists participants_self_read on public.participants;
-- drop policy if exists participants_staff_write on public.participants;
-- drop policy if exists participants_staff_update on public.participants;
-- drop policy if exists participants_staff_delete on public.participants;
-- drop policy if exists dp_staff_all_select on public.deal_participants;
-- drop policy if exists dp_member_read_same_deal on public.deal_participants;
-- drop policy if exists dp_staff_insert on public.deal_participants;
-- drop policy if exists dp_staff_update on public.deal_participants;
-- drop policy if exists dp_staff_delete on public.deal_participants;
-- drop policy if exists deals_staff_all on public.deals;
-- drop policy if exists deals_member_read on public.deals;
-- drop policy if exists deals_staff_insert on public.deals;
-- drop policy if exists deals_staff_update on public.deals;
-- drop policy if exists deals_staff_delete on public.deals;
-- drop policy if exists tasks_staff_all on public.tasks;
-- drop policy if exists tasks_assignee_read on public.tasks;
-- drop policy if exists tasks_staff_insert on public.tasks;
-- drop policy if exists tasks_staff_update on public.tasks;
-- drop policy if exists tasks_staff_delete on public.tasks;
-- drop policy if exists documents_staff_all on public.documents;
-- drop policy if exists documents_participant_select_limited on public.documents;
-- drop policy if exists documents_staff_insert on public.documents;
-- drop policy if exists documents_participant_insert on public.documents;
-- drop policy if exists documents_staff_update on public.documents;
-- drop policy if exists documents_staff_delete on public.documents;
-- drop policy if exists standard_docs_staff_select on public.standard_documents;
-- drop policy if exists standard_docs_staff_write on public.standard_documents;
-- drop policy if exists standard_docs_staff_update on public.standard_documents;
-- drop policy if exists standard_docs_staff_delete on public.standard_documents;
-- drop policy if exists audit_logs_staff_select on public.audit_logs;
-- drop policy if exists agency_contracts_staff_all on public.agency_contracts;
-- drop policy if exists client_notes_staff_all on public.client_notes;
