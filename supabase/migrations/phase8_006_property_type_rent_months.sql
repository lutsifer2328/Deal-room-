-- =========================================
-- phase8_006_property_type_rent_months.sql
-- Property type (what was sold/rented) + rent commission as a multiple of the
-- monthly rent (Bulgarian rentals rarely use a percentage).
-- Additive; no RLS change (entry field is owner-writable; rent_months on the
-- line is not a locked money field, so owners may set it at registration).
-- =========================================

alter table public.income_entries
  add column if not exists property_type text
    check (property_type in ('apartment','house','studio','office','shop','warehouse','land','garage','other'));

-- Rent commission basis: multiplier on the monthly rent (0.5 = half month,
-- 1 = one month, 2 = two months, 0.75 = 75% of a month).
alter table public.income_lines
  add column if not exists rent_months numeric check (rent_months >= 0);

-- =========================================
-- ROLLBACK
-- =========================================
-- alter table public.income_lines drop column if exists rent_months;
-- alter table public.income_entries drop column if exists property_type;
