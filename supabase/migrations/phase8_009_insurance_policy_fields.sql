-- =========================================
-- phase8_009_insurance_policy_fields.sql
-- Insurance policies carry more than a client name and a commission: the agent
-- records the policy itself. All additive entry columns; no RLS change — these
-- sit on income_entries, which owners may already write at registration, and
-- none are locked money fields.
--
-- policy_cost_gross/net (bruto/neto) describe the PREMIUM the client pays, not
-- Agenzia's commission (that stays expected_amount / the line gross).
-- insured_ident holds the client's ЕГН (personal) or ЕИК (company) number, kept
-- only to make a policy findable — indexed for search.
-- valid_to is the policy's expiry; the app mirrors it into renewal_date so the
-- existing 30-days-before renewal reminder keeps firing with no extra wiring.
-- =========================================

alter table public.income_entries
  add column if not exists policy_number text;

alter table public.income_entries
  add column if not exists policy_type text;

alter table public.income_entries
  add column if not exists policy_valid_from date;

alter table public.income_entries
  add column if not exists policy_valid_to date;

alter table public.income_entries
  add column if not exists policy_cost_gross numeric check (policy_cost_gross >= 0);

alter table public.income_entries
  add column if not exists policy_cost_net numeric check (policy_cost_net >= 0);

-- ЕГН (10-digit personal) or ЕИК/Булстат (company) — free text, either fits.
alter table public.income_entries
  add column if not exists insured_ident text;

-- Search helpers for the ledger (find a policy by its number or the client's ЕГН/ЕИК).
create index if not exists idx_income_entries_insured_ident on public.income_entries(insured_ident);
create index if not exists idx_income_entries_policy_number  on public.income_entries(policy_number);

-- =========================================
-- ROLLBACK (phase8_009)
-- =========================================
-- drop index if exists idx_income_entries_policy_number;
-- drop index if exists idx_income_entries_insured_ident;
-- alter table public.income_entries drop column if exists insured_ident;
-- alter table public.income_entries drop column if exists policy_cost_net;
-- alter table public.income_entries drop column if exists policy_cost_gross;
-- alter table public.income_entries drop column if exists policy_valid_to;
-- alter table public.income_entries drop column if exists policy_valid_from;
-- alter table public.income_entries drop column if exists policy_type;
-- alter table public.income_entries drop column if exists policy_number;
