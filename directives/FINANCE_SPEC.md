# Agenzia Finance — Specification & Build Plan

Status: **approved design, not yet built** (agreed 2026-08-04)
Replaces the "Coming Soon" placeholder at `web/src/app/finances/page.tsx`.

---

## 1. What this is

An internal income ledger for the whole agency. Every euro Agenzia earns is one
entry in a single ledger, tagged by business pillar (category). Property sales,
rentals, credit referrals, insurance, construction and interior-design referrals
all share the same skeleton; new partnerships become a dropdown option, not a
new feature.

Internal use only. No client or external participant ever sees any of it.

### The two roles

| Who | What they see |
|---|---|
| Agent (properties or insurance dept.) | Only their own entries, their own cuts, personal stats. Nothing about anyone else, ever. |
| Finance manager (the boss) | Everything: filterable ledger, stats, charts, partner and team analytics, export. |

Finance access is **its own flag, never derived from role**. The lawyer stays
`admin` for the platform and has zero finance access.

---

## 2. Core rules (agreed, non-negotiable)

1. **Privacy between employees.** No agent can ever see a colleague's deals,
   percentages, cuts, or totals. Enforced by RLS at the database level (the app
   talks to Supabase from the browser). Three leak guards:
   - Shared/split deals: each broker sees only *their own* line, never the full split.
   - No agency-wide totals or amount-leaderboards on agent screens (totals let
     agents infer colleagues' income by subtraction).
   - Client search/autocomplete inside finance searches only the agent's own entries.
2. **`finance_access` is a separate axis from `role`.** Values: `none` (default)
   | `own` | `all`. (`department` scope reserved for later.) Finance RLS never
   calls `is_staff()`/admin checks — it reads this flag only.
3. **Self-promotion lock.** Only a user with `finance_access = 'all'` can change
   anyone's `finance_access` (enforced by RLS/trigger, not just UI). Admins with
   `canManageUsers` cannot grant themselves finance access. Bootstrap: one-time
   migration sets the owner's account to `'all'`.
4. **Agents register, the manager confirms.** Agents can create entries and move
   them up to `won`. Only a finance manager can set money as received (`paid`),
   enter/override splits, and lock. After confirmation the entry locks — edits
   require `finance_access = 'all'` and are audit-logged.
5. **Percentages are snapshotted per line** at confirmation time. Changing an
   employee's default rate later never rewrites history. Referral splits are
   negotiated per deal — always typed in at confirmation, no rate tables.
6. **Received vs. expected money is never mixed.** Every total, chart and stat
   card shows *paid* by default; pipeline is always visually separate (dashed /
   own column / own card).

---

## 3. Data model

### 3.1 `users` — new columns

| Column | Type | Notes |
|---|---|---|
| `finance_access` | text: `none` \| `own` \| `all` | default `none`; update guarded (rule 3) |
| `department` | text: `properties` \| `insurance` (nullable) | for team/segment analytics |
| `default_commission_pct` | numeric, nullable | default only, always snapshotted into lines; readable only by self + finance `all` |

### 3.2 `finance_partners` (new)

External entities Agenzia works with.

| Column | Type |
|---|---|
| `id` | uuid PK |
| `name` | text |
| `type` | text: `credit_consultant` \| `construction` \| `interior_design` \| `insurance_provider` \| `external_agency` \| `other` |
| `default_terms` | text (free text: "pays 1% of secured credit", "20% of their fee") |
| `contact`, `notes` | text |
| `is_active` | boolean |

Readable/writable only by finance `all`. Powers the partner league table
(revenue per partner, conversion, money paid away to co-broke agencies).

### 3.3 `income_entries` (new) — the ledger

One row per revenue event (a closed deal, a referral, a policy).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK |
| `owner_id` | uuid → users | the agent who sourced it |
| `category` | text: `sale` \| `rent` \| `credit_referral` \| `construction_referral` \| `interior_design_referral` \| `insurance` | |
| `status` | text: `referred` \| `in_progress` \| `won` \| `paid` \| `partially_paid` \| `lost` \| `cancelled` | agents max out at `won` |
| `client_name` | text | primary client (buyer-side deals may add second client on lines) |
| `deal_date` | date | when signed/closed |
| `partner_id` | uuid → finance_partners, nullable | referrals + external co-broke |
| `deal_id` | uuid → deals, nullable | link when the deal lived in the Deal Room |
| `property_ref` | text, nullable | CRM number when no deal_id (e.g. AGZ-2024-001) |
| `property_address` | text, nullable | |
| `listing_source` | text: `portfolio` \| `external`, nullable | property categories only |
| `cobroke` | text: `none` \| `internal` \| `external` | internal = 2 owner lines; external = partner_id + `external_share` |
| `external_share` | numeric, nullable | amount paid away to the external agency (before internal split) |
| `renewal_date` | date, nullable | insurance; drives reminders |
| `renewed_from` | uuid → income_entries, nullable | renewal chain / retention history |
| `expected_amount` | numeric, nullable | what the agent said was agreed (pipeline figure) |
| `currency` | text, default `EUR` | BGN allowed for historic entries |
| `notes` | text | |
| `confirmed_by`, `confirmed_at`, `locked_at` | audit of confirmation | |
| `created_at`, `updated_at` | timestamps | |

### 3.4 `income_lines` (new) — the money & the split

1–2+ lines per entry. A both-sides Bulgarian deal = one entry, a buyer line and
a seller line (two clients, one deal). An internal co-broke = lines with
different `owner_id`s.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK |
| `entry_id` | uuid → income_entries |
| `owner_id` | uuid → users | who earns this line's cut (RLS filters **lines**, not just entries) |
| `side` | text: `buyer` \| `seller` \| `tenant` \| `landlord` \| `n/a` | |
| `client_name` | text | the client on this side |
| `gross_amount` | numeric | commission received on this line |
| `vat_included` | boolean | splits computed on net |
| `amount_cash` / `amount_bank` | numeric | must sum to gross; cash/bank filterable everywhere |
| `broker_pct` | numeric | snapshot, typed at confirmation, overridable per entry |
| `broker_cut` / `agency_cut` | numeric | computed & stored at confirmation |
| `received_date` | date | cash-basis reporting groups by this |
| `invoice_no` | text, nullable | |

### 3.5 Audit

Reuse the `audit_logs` pattern: `REGISTERED_INCOME`, `CONFIRMED_INCOME`,
`EDITED_LOCKED_INCOME`, `CHANGED_FINANCE_ACCESS`, `REGISTERED_RENEWAL`.

---

## 4. RLS (the part to be disciplined about)

New helper, e.g. `finance_access_level()` returning the caller's flag.
**No finance policy may ever fall back to `is_staff()` or admin checks.**

- `income_entries`: SELECT/INSERT/UPDATE where `owner_id = auth.uid()` and
  status transitions limited to ≤ `won` and not locked; OR `finance_access = 'all'`.
- `income_lines`: SELECT where `owner_id = auth.uid()` OR finance `all`.
  INSERT/UPDATE of money+pct fields: finance `all` only.
- `finance_partners`: finance `all` only. (Agents pick partners via a
  SECURITY DEFINER function or a name-only view — they need the list to
  register a referral, not the terms/notes.)
- `users.finance_access` + `default_commission_pct`: readable by self + finance
  `all`; writable by finance `all` only (trigger-enforced, incl. column-level check).

---

## 5. Screens

### 5.1 Agent view ("My finance") — dumb-proof by design

- **Register flow, 2 steps.** Step 1: four big tiles — Property sale / Rental /
  Referral (→ sub-tiles: credit, construction, interior design) / Insurance.
  Step 2: a short plain-language form. Address, date (defaults today), client
  name(s), "commission from" (defaults *both sides*), amount **optional**
  ("leave blank if not final yet"). No percentages, no VAT, no invoice fields on
  agent screens — every question answerable from memory.
  - Amount given → entry born `won` with `expected_amount` (pipeline).
  - Blank → entry born `won`/`referred` with no figure. Same path either way.
  - Footer: "The office confirms the money — you'll see your cut once it's paid."
- **Dashboard:** three numbers (earned this month, awaiting payment, renewals
  due) + list of their entries with plain chips: Registered / Awaiting payment /
  Paid — your cut: €Z / Renews {date}. No percentages displayed anywhere except
  their own confirmed cuts.
- Bilingual labels via `translations.ts` (BG labels are the ones that matter).

### 5.2 Manager view — 5 tabs

1. **Overview** — global filters (year, month/range; everything below re-slices):
   - Revenue by pillar, horizontal bars + YoY %.
   - Partner league table: paid us / conversion (**won / sent**) / negative rows
     for co-broke money paid away.
   - Monthly revenue columns; current month partial; pipeline dashed.
   - "Where sales come from": portfolio-solo / co-broke-internal / co-broke-external split.
   - Cross-sell headline: % of property clients that also generated a referral
     (matched by client name — free from the data).
2. **Ledger** — the table. Compact columns: date, segment, employee, client/side,
   cash, bank, status. Filters: segment, employee, year, month, date range,
   status, cash/bank. **Totals row always sums the current filter.** Both-sides
   deals = two rows (toggle: collapse to one per deal). Row click → full detail
   drawer: property + CRM ref, listing source, co-broke breakdown, both clients,
   cash/bank, VAT, who registered, confirmation + audit trail. **Export CSV/XLSX**
   of the filtered view.
3. **Partners** — registry CRUD + per-partner history and conversion.
4. **Team** — per-employee revenue by pillar, deal counts, average commission
   per deal. Manager-only; never an agent-visible leaderboard.
5. **Renewals & pipeline** — insurance renewals due (chase list), lapsed
   renewals, retention rate (renewed/due); referrals sitting in `won` with no
   payment (chase the partner).

### 5.3 Confirmation flow (manager)

Open entry → enter actual gross per line, VAT flag, cash/bank split, per-line
`broker_pct` (prefilled from the employee default, editable per deal) →
computed cuts shown live → mark `paid` (or `partially_paid`) → entry locks.
`Cancelled`/`lost` void an entry without deleting it.

### 5.4 Sidebar & settings

- "Finances" sidebar item renders only when `finance_access != 'none'`.
- Settings → employee editor gains Department, Default commission %, and
  Finance access — the latter two visible/editable **only** to finance `all`
  (the lawyer-admin cannot see rates).

### 5.5 Reminders

Insurance: notification to owner + manager 30 days before `renewal_date`
(reuse the existing notifications + expiring-docs pattern). "Register renewal"
on an entry clones it pre-filled with `renewed_from` set.

---

## 6. Build order

Each phase ships something usable; later phases never rework earlier ones.

**Phase F1 — Foundations & access control**
Migration: `users` columns + `finance_partners` + `income_entries` +
`income_lines`, `finance_access_level()` helper, all RLS policies, the
self-promotion trigger, bootstrap owner to `all`. Sidebar gating. Settings
fields. *Test gate: lawyer-admin sees nothing, cannot self-grant; agent A gets
zero of agent B's rows via direct API calls.*

**Phase F2 — Agent register flow + agent dashboard**
Two-step wizard, entry list, personal stats. Statuses up to `won`.
*Gate: an agent can register all 6 categories in under a minute each; blank
amount path works.*

**Phase F3 — Manager ledger + confirmation**
Ledger tab with filters + totals row + detail drawer; confirmation flow with
splits, cash/bank, VAT, locking; audit log entries; CSV export.
*Gate: register→confirm→locked round-trip; totals match hand-computed sums;
both-sides deal shows as 2 rows / 2 clients.*

**Phase F4 — Overview + Partners + Team tabs**
Charts (received-only, pipeline dashed), partner league + conversion +
paid-away, portfolio/co-broke split, cross-sell stat, team analytics.

**Phase F5 — Renewals & pipeline**
Renewal reminders + chase lists + retention; "register renewal" cloning;
pipeline aging for unpaid `won` referrals.

**Deliberately out of v1:** recurring property-management fees, referral-fee
automation, installment schedules beyond `partially_paid` + notes, department-
scoped access tier, per-category default rates (per-deal entry covers it).

---

## 7. Open items to confirm during build

- Insurance mechanics: what a renewal commission is a % of (label/UX only —
  amounts are typed at confirmation anyway, schema unaffected).
- Whether the boss wants the collapse-to-one-row-per-deal toggle default on/off.
- Exact reminder lead time (default 30 days).
