-- =========================================
-- phase1_001_helper_functions.sql
-- SECURITY DEFINER helper functions (no RLS recursion)
-- Run FIRST before any policy changes
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

-- =========================================
-- VERIFICATION (run after executing)
-- =========================================
-- select public.is_staff();
-- select public.current_participant_id();
-- select proname, prosecdef from pg_proc where proname in ('is_staff', 'current_participant_id', 'is_deal_member', 'can_upload_to_task', 'can_read_document_row');
