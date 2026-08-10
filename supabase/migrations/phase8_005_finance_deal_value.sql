-- =========================================
-- phase8_005_finance_deal_value.sql
-- Capture the property price and the negotiated agency rate so the gross
-- commission is computed (price x agency%) rather than typed directly.
-- Additive; no RLS change — deal_value sits on the entry (owners may write
-- entry fields) and agency_pct on the line is NOT a locked money field, so the
-- existing owner line policies already permit agents to set it at registration.
-- =========================================

alter table public.income_entries
  add column if not exists deal_value numeric check (deal_value >= 0);

alter table public.income_lines
  add column if not exists agency_pct numeric check (agency_pct >= 0 and agency_pct <= 100);

-- =========================================
-- ROLLBACK
-- =========================================
-- alter table public.income_lines drop column if exists agency_pct;
-- alter table public.income_entries drop column if exists deal_value;
