-- =========================================
-- phase1_002_schema_additions.sql
-- Additive-only schema changes (no data destruction)
-- =========================================

-- Add assigned_participant_id to tasks (required for participant-level task visibility)
alter table public.tasks
  add column if not exists assigned_participant_id uuid null;

-- Add FK constraint (safe, does not delete data)
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

-- Performance index
create index if not exists idx_tasks_assigned_participant_id
  on public.tasks (assigned_participant_id);

-- =========================================
-- IMPORTANT NOTE:
-- Your app currently uses tasks.assigned_to (text).
-- Phase 1 does NOT change app code.
-- But for participant visibility to work securely, tasks assigned to externals
-- must populate assigned_participant_id.
-- If assigned_participant_id is NULL, participants will NOT see the task.
-- (This is correct & secure — it means the task has not been formally assigned.)
-- =========================================

-- ROLLBACK (if needed):
-- alter table public.tasks drop column if exists assigned_participant_id;
-- drop index if exists idx_tasks_assigned_participant_id;

-- VERIFICATION:
-- select column_name, data_type, is_nullable
-- from information_schema.columns
-- where table_schema = 'public' and table_name = 'tasks' and column_name = 'assigned_participant_id';
