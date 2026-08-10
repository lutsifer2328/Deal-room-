-- =========================================
-- phase8_003_finance_grants_hardening.sql
-- Tighten EXECUTE grants on the F1 functions (advisor 0028/0029).
-- The trigger function must not be RPC-callable; the helpers need only
-- authenticated (they are used in RLS policies) — not anon.
-- Triggers fire regardless of EXECUTE grants, so revoking is safe.
-- =========================================

revoke all on function public.guard_finance_fields() from public, anon, authenticated;

revoke all on function public.finance_access_level() from public, anon;
revoke all on function public.has_finance_all() from public, anon;
revoke all on function public.owns_editable_entry(uuid) from public, anon;

grant execute on function public.finance_access_level() to authenticated, service_role;
grant execute on function public.has_finance_all() to authenticated, service_role;
grant execute on function public.owns_editable_entry(uuid) to authenticated, service_role;
