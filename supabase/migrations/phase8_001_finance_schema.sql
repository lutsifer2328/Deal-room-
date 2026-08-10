-- =========================================
-- phase8_001_finance_schema.sql
-- Finance module (F1) — additive schema only.
-- New tables + new NULLABLE-safe columns on users.
-- Does NOT touch any existing column, policy, or table behavior.
-- =========================================

-- 1) USERS: new columns (additive)
--    finance_access is the separate authority axis (never derived from role).
alter table public.users
  add column if not exists finance_access text not null default 'none'
    check (finance_access in ('none','own','all'));

alter table public.users
  add column if not exists department text
    check (department in ('properties','insurance'));

alter table public.users
  add column if not exists default_commission_pct numeric
    check (default_commission_pct >= 0 and default_commission_pct <= 100);

-- 2) FINANCE_PARTNERS: external entities Agenzia works with
create table if not exists public.finance_partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null
    check (type in ('credit_consultant','construction','interior_design','insurance_provider','external_agency','other')),
  default_terms text,
  contact text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- 3) INCOME_ENTRIES: the ledger (one row per revenue event)
create table if not exists public.income_entries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id),
  category text not null
    check (category in ('sale','rent','credit_referral','construction_referral','interior_design_referral','insurance')),
  status text not null default 'won'
    check (status in ('referred','in_progress','won','paid','partially_paid','lost','cancelled')),
  client_name text,
  deal_date date,
  partner_id uuid references public.finance_partners(id),
  deal_id uuid references public.deals(id),
  property_ref text,
  property_address text,
  listing_source text check (listing_source in ('portfolio','external')),
  cobroke text not null default 'none'
    check (cobroke in ('none','internal','external')),
  external_share numeric check (external_share >= 0),
  renewal_date date,
  renewed_from uuid references public.income_entries(id),
  expected_amount numeric check (expected_amount >= 0),
  currency text not null default 'EUR',
  notes text,
  created_by uuid references public.users(id),
  confirmed_by uuid references public.users(id),
  confirmed_at timestamptz,
  locked_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- 4) INCOME_LINES: the money + the split (1-2+ lines per entry; per side/owner)
create table if not exists public.income_lines (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.income_entries(id) on delete cascade,
  owner_id uuid not null references public.users(id),
  side text not null default 'n/a'
    check (side in ('buyer','seller','tenant','landlord','n/a')),
  client_name text,
  gross_amount numeric check (gross_amount >= 0),
  vat_included boolean not null default false,
  amount_cash numeric check (amount_cash >= 0),
  amount_bank numeric check (amount_bank >= 0),
  broker_pct numeric check (broker_pct >= 0 and broker_pct <= 100),
  broker_cut numeric check (broker_cut >= 0),
  agency_cut numeric check (agency_cut >= 0),
  received_date date,
  invoice_no text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- 5) Indexes for the filters the manager dashboard needs
create index if not exists idx_income_entries_owner   on public.income_entries(owner_id);
create index if not exists idx_income_entries_category on public.income_entries(category);
create index if not exists idx_income_entries_status   on public.income_entries(status);
create index if not exists idx_income_entries_dealdate on public.income_entries(deal_date);
create index if not exists idx_income_entries_renewal  on public.income_entries(renewal_date);
create index if not exists idx_income_entries_partner  on public.income_entries(partner_id);
create index if not exists idx_income_entries_deal     on public.income_entries(deal_id);
create index if not exists idx_income_lines_entry      on public.income_lines(entry_id);
create index if not exists idx_income_lines_owner      on public.income_lines(owner_id);

-- =========================================
-- ROLLBACK (phase8_001)
-- =========================================
-- drop table if exists public.income_lines;
-- drop table if exists public.income_entries;
-- drop table if exists public.finance_partners;
-- alter table public.users drop column if exists default_commission_pct;
-- alter table public.users drop column if exists department;
-- alter table public.users drop column if exists finance_access;
