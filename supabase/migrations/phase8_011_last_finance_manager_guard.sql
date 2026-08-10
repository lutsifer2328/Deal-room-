-- =========================================
-- phase8_011_last_finance_manager_guard.sql
-- Last-manager safeguard: never let the FINAL finance manager lose 'all'
-- through the app. A mistimed self-downgrade (or downgrading the only other
-- manager) would otherwise leave zero users with finance_access='all', and the
-- UI can only grant 'all' from an existing manager — locking finance out with
-- no in-app recovery.
--
-- Design:
--   * The check sits AFTER the `auth.uid() is null` early return, so elevated
--     contexts (service_role, migrations, trusted server code) still bypass it.
--     That preserves a deliberate recovery/bootstrap path via SQL, exactly like
--     phase8_004 seeded the first manager.
--   * It only fires when a row is moving AWAY from 'all'. Granting, or edits
--     that keep 'all', are unaffected.
--   * "Last" is counted excluding the row being changed, so downgrading one of
--     several managers is always allowed.
--
-- Re-run-safe: create or replace only. Run AFTER phase8_002.
-- =========================================

create or replace function public.guard_finance_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Elevated/server contexts (service_role, migrations) bypass every check.
  -- This is the intentional recovery hatch: SQL can still fix a locked-out
  -- finance module even though the app cannot.
  if auth.uid() is null then
    return new;
  end if;

  if (new.finance_access is distinct from old.finance_access
      or new.default_commission_pct is distinct from old.default_commission_pct) then
    -- Only a finance manager may touch finance access or commission rate.
    if coalesce((select u.finance_access from public.users u where u.id = auth.uid()), 'none') <> 'all' then
      raise exception 'Only a finance manager (finance_access=all) can change finance access or commission rate';
    end if;
  end if;

  -- Last-manager safeguard: block the update if this row is leaving 'all' and
  -- no other user would still be a manager afterwards.
  if old.finance_access = 'all' and new.finance_access is distinct from 'all' then
    if not exists (
      select 1 from public.users u
      where u.finance_access = 'all' and u.id <> old.id
    ) then
      raise exception 'Cannot remove the last finance manager. Grant finance_access=all to another user first.';
    end if;
  end if;

  return new;
end;
$$;

-- Trigger definition is unchanged from phase8_002; re-assert it so this file is
-- self-contained if replayed against a fresh DB after phase8_002.
drop trigger if exists trg_guard_finance_fields on public.users;
create trigger trg_guard_finance_fields
  before update on public.users
  for each row execute function public.guard_finance_fields();

-- =========================================
-- ROLLBACK (phase8_011) — restores the phase8_002 body (no last-manager check)
-- =========================================
-- create or replace function public.guard_finance_fields()
-- returns trigger language plpgsql security definer set search_path = public as $$
-- begin
--   if auth.uid() is null then return new; end if;
--   if (new.finance_access is distinct from old.finance_access
--       or new.default_commission_pct is distinct from old.default_commission_pct) then
--     if coalesce((select u.finance_access from public.users u where u.id = auth.uid()), 'none') <> 'all' then
--       raise exception 'Only a finance manager (finance_access=all) can change finance access or commission rate';
--     end if;
--   end if;
--   return new;
-- end;
-- $$;
