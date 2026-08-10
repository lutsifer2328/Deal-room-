-- =========================================
-- phase8_010_house_deal.sql
-- "House deal": the agency closed it directly, with no broker taking a cut —
-- 100% of the commission is agency income. A dedicated flag (rather than
-- inferring it from broker_pct = 0) so it can be labelled and so confirmation
-- can force the split. Additive; owner-writable entry field, no RLS change.
-- =========================================

alter table public.income_entries
  add column if not exists house_deal boolean not null default false;

-- =========================================
-- ROLLBACK
-- =========================================
-- alter table public.income_entries drop column if exists house_deal;
