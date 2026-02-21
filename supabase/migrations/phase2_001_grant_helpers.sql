-- =========================================
-- phase2_001_grant_helpers.sql
-- CRITICAL: Grant EXECUTE on RLS helper functions to 'authenticated' ONLY
-- Revoke from 'anon' and 'public' to lock down access
-- =========================================

-- 1. Revoke from PUBLIC (default grant target)
revoke all on function public.is_staff() from public;
revoke all on function public.current_participant_id() from public;
revoke all on function public.is_deal_member(uuid) from public;
revoke all on function public.can_upload_to_task(uuid, uuid) from public;
revoke all on function public.can_read_document_row(uuid) from public;

-- 2. Revoke from anon explicitly
revoke all on function public.is_staff() from anon;
revoke all on function public.current_participant_id() from anon;
revoke all on function public.is_deal_member(uuid) from anon;
revoke all on function public.can_upload_to_task(uuid, uuid) from anon;
revoke all on function public.can_read_document_row(uuid) from anon;

-- 3. Grant EXECUTE to authenticated ONLY (required for RLS policy evaluation)
grant execute on function public.is_staff() to authenticated;
grant execute on function public.current_participant_id() to authenticated;
grant execute on function public.is_deal_member(uuid) to authenticated;
grant execute on function public.can_upload_to_task(uuid, uuid) to authenticated;
grant execute on function public.can_read_document_row(uuid) to authenticated;

-- =========================================
-- VERIFICATION: Run after applying
-- =========================================
-- select routine_name, grantee, privilege_type
-- from information_schema.routine_privileges
-- where routine_schema = 'public'
--   and routine_name in ('is_staff','current_participant_id','is_deal_member','can_upload_to_task','can_read_document_row')
-- order by routine_name, grantee;
