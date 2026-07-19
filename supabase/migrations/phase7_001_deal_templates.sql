-- =========================================
-- phase7_001_deal_templates.sql
-- Lawyer-managed deal checklists (deal templates).
-- Items reference standard_documents by id, so renaming a standard
-- document updates every template automatically instead of drifting.
-- =========================================

-- Who may CHANGE templates: admin + lawyer only.
-- (is_staff() — admin/lawyer/staff — governs READ, so staff can apply
-- checklists when creating deals but cannot edit them.)
create or replace function public.is_template_manager()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.users u
    where u.id = auth.uid()
      and u.is_active = true
      and u.role in ('admin','lawyer')
  );
$$;

-- Lock down, then grant EXECUTE to authenticated.
-- CRITICAL: 'authenticated' is required for RLS policy evaluation — without it
-- the policies below silently deny every write. (Same fix as phase2_001, which
-- had to repair the phase1 helpers that were granted only to postgres/service_role.)
revoke all on function public.is_template_manager() from public;
revoke all on function public.is_template_manager() from anon;
grant execute on function public.is_template_manager() to postgres, service_role;
grant execute on function public.is_template_manager() to authenticated;

create table if not exists public.deal_templates (
  id          uuid primary key default gen_random_uuid(),
  name_en     text not null,
  name_bg     text,
  description text,
  items       jsonb not null default '[]'::jsonb,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid references public.users(id) on delete set null
);

create index if not exists deal_templates_active_idx on public.deal_templates (is_active);

alter table public.deal_templates enable row level security;

-- All staff (admin/lawyer/staff) may read and therefore apply templates.
drop policy if exists deal_templates_staff_read on public.deal_templates;
create policy deal_templates_staff_read on public.deal_templates
  for select to authenticated using (public.is_staff());

-- Only admin/lawyer may create, edit, or remove them.
drop policy if exists deal_templates_manager_insert on public.deal_templates;
create policy deal_templates_manager_insert on public.deal_templates
  for insert to authenticated with check (public.is_template_manager());

drop policy if exists deal_templates_manager_update on public.deal_templates;
create policy deal_templates_manager_update on public.deal_templates
  for update to authenticated using (public.is_template_manager())
  with check (public.is_template_manager());

drop policy if exists deal_templates_manager_delete on public.deal_templates;
create policy deal_templates_manager_delete on public.deal_templates
  for delete to authenticated using (public.is_template_manager());

-- Table privileges (RLS filters rows; these grant the verbs).
grant select on public.deal_templates to authenticated;
grant insert, update, delete on public.deal_templates to authenticated;

create or replace function public.touch_deal_templates_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists deal_templates_touch_updated_at on public.deal_templates;
create trigger deal_templates_touch_updated_at
before update on public.deal_templates
for each row execute function public.touch_deal_templates_updated_at();

-- No seed data on purpose — the lawyer builds the checklists in the UI.

-- =========================================
-- VERIFICATION: run after applying
-- =========================================
-- select routine_name, grantee, privilege_type
-- from information_schema.routine_privileges
-- where routine_schema = 'public' and routine_name = 'is_template_manager';
--
-- select polname, polcmd from pg_policy
-- where polrelid = 'public.deal_templates'::regclass;
