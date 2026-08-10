-- =========================================
-- phase8_004_bootstrap_finance_owner.sql
-- One-time: grant the first finance manager (finance_access='all').
-- Runs in an elevated/migration context (auth.uid() null), so the
-- guard_finance_fields trigger permits it. From here on, only a finance
-- manager can grant finance access to anyone else.
-- =========================================

update public.users
set finance_access = 'all'
where email = 'lutsifer@gmail.com';
