-- =========================================
-- mock_finance_teardown.sql
-- Wipes ALL finance test data seeded on 2026-08-04 and the 5 mock users.
-- SAFE: only touches rows tied to the @mock.agenzia.test users (and notes='MOCK').
-- Nothing belonging to real accounts is affected.
-- Run the whole file to clean up after testing.
-- =========================================

-- 1) Commission lines owned by mock users (belt-and-braces; entries cascade too)
delete from public.income_lines
where owner_id in (select id from public.users where email like '%@mock.agenzia.test');

-- 2) Ledger entries owned by mock users OR explicitly tagged MOCK (cascades any lines)
delete from public.income_entries
where owner_id in (select id from public.users where email like '%@mock.agenzia.test')
   or notes = 'MOCK';

-- 3) The mock profiles
delete from public.users where email like '%@mock.agenzia.test';

-- 4) The mock auth accounts
delete from auth.users where email like '%@mock.agenzia.test';

-- Verify (all should be 0):
-- select
--   (select count(*) from public.income_entries where notes='MOCK') as entries,
--   (select count(*) from public.users where email like '%@mock.agenzia.test') as profiles,
--   (select count(*) from auth.users where email like '%@mock.agenzia.test') as auth_users;
