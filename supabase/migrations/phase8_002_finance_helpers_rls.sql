-- =========================================
-- phase8_002_finance_helpers_rls.sql
-- Finance module (F1) — helper functions, self-promotion lock, RLS.
-- CRITICAL RULE: no finance policy may call is_staff() or any admin check.
-- Finance visibility is governed ONLY by users.finance_access.
-- Run AFTER phase8_001.
-- =========================================

-- ---------- Helper functions (SECURITY DEFINER, no RLS recursion) ----------

-- finance_access_level(): the CURRENT user's finance flag ('none'|'own'|'all')
create or replace function public.finance_access_level()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select u.finance_access from public.users u where u.id = auth.uid()), 'none');
$$;

revoke all on function public.finance_access_level() from public;
grant execute on function public.finance_access_level() to authenticated, service_role;

-- has_finance_all(): true if current user is a finance manager
create or replace function public.has_finance_all()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.finance_access_level() = 'all';
$$;

revoke all on function public.has_finance_all() from public;
grant execute on function public.has_finance_all() to authenticated, service_role;

-- owns_editable_entry(uuid): true if current user owns that entry and it is not locked
create or replace function public.owns_editable_entry(entry_uuid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.income_entries e
    where e.id = entry_uuid
      and e.owner_id = auth.uid()
      and e.locked_at is null
  );
$$;

revoke all on function public.owns_editable_entry(uuid) from public;
grant execute on function public.owns_editable_entry(uuid) to authenticated, service_role;

-- ---------- Self-promotion lock on users.finance_access ----------
-- Only a finance manager (finance_access='all') may change finance_access or
-- default_commission_pct. Admins with canManageUsers cannot self-grant.
-- Elevated/server contexts (auth.uid() is null → service_role, postgres, this
-- migration) bypass, so seeding and trusted server code still work.
create or replace function public.guard_finance_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if (new.finance_access is distinct from old.finance_access
      or new.default_commission_pct is distinct from old.default_commission_pct) then
    if coalesce((select u.finance_access from public.users u where u.id = auth.uid()), 'none') <> 'all' then
      raise exception 'Only a finance manager (finance_access=all) can change finance access or commission rate';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_finance_fields on public.users;
create trigger trg_guard_finance_fields
  before update on public.users
  for each row execute function public.guard_finance_fields();

-- ---------- RLS: finance_partners (manager-only for now) ----------
alter table public.finance_partners enable row level security;

drop policy if exists fin_partners_manager_all on public.finance_partners;
create policy fin_partners_manager_all
  on public.finance_partners
  for all
  to authenticated
  using (public.has_finance_all())
  with check (public.has_finance_all());

-- ---------- RLS: income_entries ----------
alter table public.income_entries enable row level security;

-- Finance managers: full access
drop policy if exists fin_entries_manager_all on public.income_entries;
create policy fin_entries_manager_all
  on public.income_entries
  for all
  to authenticated
  using (public.has_finance_all())
  with check (public.has_finance_all());

-- Owners: read only their own entries
drop policy if exists fin_entries_owner_read on public.income_entries;
create policy fin_entries_owner_read
  on public.income_entries
  for select
  to authenticated
  using (owner_id = auth.uid());

-- Owners: register their own entries; cannot pre-confirm, pre-lock, or mark paid
drop policy if exists fin_entries_owner_insert on public.income_entries;
create policy fin_entries_owner_insert
  on public.income_entries
  for insert
  to authenticated
  with check (
    owner_id = auth.uid()
    and status in ('referred','in_progress','won')
    and confirmed_at is null
    and confirmed_by is null
    and locked_at is null
  );

-- Owners: edit their own entries while unlocked; still cannot reach paid/lock
drop policy if exists fin_entries_owner_update on public.income_entries;
create policy fin_entries_owner_update
  on public.income_entries
  for update
  to authenticated
  using (owner_id = auth.uid() and locked_at is null)
  with check (
    owner_id = auth.uid()
    and status in ('referred','in_progress','won','lost','cancelled')
    and confirmed_at is null
    and confirmed_by is null
    and locked_at is null
  );

-- ---------- RLS: income_lines (RLS filters LINES, not just entries) ----------
alter table public.income_lines enable row level security;

-- Finance managers: full access (they set money + splits)
drop policy if exists fin_lines_manager_all on public.income_lines;
create policy fin_lines_manager_all
  on public.income_lines
  for all
  to authenticated
  using (public.has_finance_all())
  with check (public.has_finance_all());

-- Owners: read only their own lines (shared deal → each sees only their line)
drop policy if exists fin_lines_owner_read on public.income_lines;
create policy fin_lines_owner_read
  on public.income_lines
  for select
  to authenticated
  using (owner_id = auth.uid());

-- Owners: add lines to their own editable entries, but NEVER any money field
drop policy if exists fin_lines_owner_insert on public.income_lines;
create policy fin_lines_owner_insert
  on public.income_lines
  for insert
  to authenticated
  with check (
    owner_id = auth.uid()
    and public.owns_editable_entry(entry_id)
    and gross_amount is null and amount_cash is null and amount_bank is null
    and broker_pct is null and broker_cut is null and agency_cut is null
  );

-- Owners: edit their own lines on editable entries, still no money fields
drop policy if exists fin_lines_owner_update on public.income_lines;
create policy fin_lines_owner_update
  on public.income_lines
  for update
  to authenticated
  using (owner_id = auth.uid() and public.owns_editable_entry(entry_id))
  with check (
    owner_id = auth.uid()
    and gross_amount is null and amount_cash is null and amount_bank is null
    and broker_pct is null and broker_cut is null and agency_cut is null
  );

-- =========================================
-- ROLLBACK (phase8_002)
-- =========================================
-- drop trigger if exists trg_guard_finance_fields on public.users;
-- drop function if exists public.guard_finance_fields();
-- drop policy if exists fin_partners_manager_all on public.finance_partners;
-- drop policy if exists fin_entries_manager_all on public.income_entries;
-- drop policy if exists fin_entries_owner_read on public.income_entries;
-- drop policy if exists fin_entries_owner_insert on public.income_entries;
-- drop policy if exists fin_entries_owner_update on public.income_entries;
-- drop policy if exists fin_lines_manager_all on public.income_lines;
-- drop policy if exists fin_lines_owner_read on public.income_lines;
-- drop policy if exists fin_lines_owner_insert on public.income_lines;
-- drop policy if exists fin_lines_owner_update on public.income_lines;
-- drop function if exists public.owns_editable_entry(uuid);
-- drop function if exists public.has_finance_all();
-- drop function if exists public.finance_access_level();
