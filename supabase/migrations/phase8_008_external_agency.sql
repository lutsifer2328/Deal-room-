-- =========================================
-- phase8_008_external_agency.sql
-- Name of the outside agency on a co-brokered deal (free text until the
-- finance_partners registry ships). Additive; owner-writable entry field.
-- =========================================

alter table public.income_entries
  add column if not exists external_agency text;

-- =========================================
-- ROLLBACK
-- =========================================
-- alter table public.income_entries drop column if exists external_agency;
