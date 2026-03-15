-- =========================================
-- phase1_006_vault_columns_and_policy_dedup.sql
-- Master Bible v6.0 – Final Phase 1 step
-- 1. Additive schema: Private Vault columns on documents
-- 2. Policy de-duplication: drop all legacy/redundant policies
-- 3. Verification queries (run after executing)
-- =========================================

-- =========================================
-- STEP 1 – DOCUMENTS TABLE: Spec D & E columns (additive, idempotent)
-- =========================================

-- Spec D: storage_path – actual object path inside the storage bucket
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS storage_path text;

-- Spec E: owner_participant_id – participant who "owns" the vault slot
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS owner_participant_id uuid
  REFERENCES public.participants(id)
  ON DELETE SET NULL;

-- Performance index for owner lookups
CREATE INDEX IF NOT EXISTS idx_documents_owner_participant_id
  ON public.documents (owner_participant_id);

-- =========================================
-- STEP 2 – POLICY CLEAN SWEEP
--
-- We drop every known legacy/redundant policy by name.
-- All DROP POLICY calls use IF EXISTS — completely safe if already gone.
-- The Phase 1 canonical policies (from phase1_004_rls_policies.sql) are
-- the ONLY ones that survive:
--   users_staff_all, users_self_read, users_staff_write, users_staff_update, users_staff_delete
--   deals_staff_all, deals_member_read, deals_staff_insert, deals_staff_update, deals_staff_delete
--   documents_staff_all, documents_participant_select_limited,
--   documents_staff_insert, documents_participant_insert,
--   documents_staff_update, documents_staff_delete
-- =========================================

-- ---- USERS: drop legacy permissive & v2.5 overlapping policies ----

-- From schema.sql (original permissive set)
DROP POLICY IF EXISTS "Allow logged-in read access" ON public.users;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.users;

-- From fix_rls_v2_5.sql (intermediate named policies)
DROP POLICY IF EXISTS "Allow users to read own record" ON public.users;
DROP POLICY IF EXISTS "Allow internal staff to read all users" ON public.users;


-- ---- DEALS: drop legacy permissive & old internal insert policy ----

-- From schema.sql
DROP POLICY IF EXISTS "Allow logged-in read access" ON public.deals;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.deals;

-- From earlier fix scripts
DROP POLICY IF EXISTS "Authenticated users can view deals" ON public.deals;
DROP POLICY IF EXISTS "Authenticated users can create deals" ON public.deals;
DROP POLICY IF EXISTS "Authenticated users can update/delete deals" ON public.deals;

-- From fix_rls_v2_5.sql (the "old" internal staff insert policy)
DROP POLICY IF EXISTS "Allow internal staff to insert deals" ON public.deals;


-- ---- DOCUMENTS: drop legacy permissive & v2.5 consolidated policies ----

-- From schema.sql
DROP POLICY IF EXISTS "Allow logged-in read access" ON public.documents;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.documents;

-- From fix_rls_v2_5.sql (the three broad policies replaced by phase1_004)
DROP POLICY IF EXISTS "Enable select for participants and staff" ON public.documents;
DROP POLICY IF EXISTS "Enable insert for participants and staff" ON public.documents;
DROP POLICY IF EXISTS "Enable update for creators/admins" ON public.documents;

-- Any other known variant names from intermediate scripts
DROP POLICY IF EXISTS "Allow staff to insert documents" ON public.documents;
DROP POLICY IF EXISTS "Allow staff to update documents" ON public.documents;
DROP POLICY IF EXISTS "Allow participants to insert documents" ON public.documents;


-- ---- PARTICIPANTS: drop permissive originals ----

DROP POLICY IF EXISTS "Allow logged-in read access" ON public.participants;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.participants;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.participants;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON public.participants;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.participants;


-- ---- DEAL_PARTICIPANTS: drop permissive originals ----

DROP POLICY IF EXISTS "Allow logged-in read access" ON public.deal_participants;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.deal_participants;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.deal_participants;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON public.deal_participants;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.deal_participants;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.deal_participants;


-- ---- TASKS: drop permissive originals ----

DROP POLICY IF EXISTS "Allow logged-in read access" ON public.tasks;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.tasks;


-- ---- STANDARD_DOCUMENTS: drop permissive originals ----

DROP POLICY IF EXISTS "Allow logged-in read access" ON public.standard_documents;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.standard_documents;


-- ---- AUDIT_LOGS: drop permissive originals ----

DROP POLICY IF EXISTS "Allow logged-in read access" ON public.audit_logs;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.audit_logs;


-- ---- AGENCY_CONTRACTS: drop permissive originals ----

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.agency_contracts;


-- =========================================
-- STEP 3 – VERIFICATION QUERIES
-- Run these in the Supabase SQL editor after executing this migration.
-- =========================================

-- PART 1: Confirm new columns exist on documents
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND table_name = 'documents'
--   AND column_name IN ('storage_path', 'owner_participant_id')
-- ORDER BY column_name;
-- Expected: 2 rows returned.

-- PART 3: Confirm zero duplicate / legacy policies remain
-- SELECT tablename, policyname, cmd
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND policyname IN (
--     'Allow logged-in read access',
--     'Enable all access for authenticated users',
--     'Allow users to read own record',
--     'Allow internal staff to read all users',
--     'Allow internal staff to insert deals',
--     'Authenticated users can view deals',
--     'Authenticated users can create deals',
--     'Authenticated users can update/delete deals',
--     'Enable select for participants and staff',
--     'Enable insert for participants and staff',
--     'Enable update for creators/admins',
--     'Allow staff to insert documents',
--     'Allow staff to update documents',
--     'Allow participants to insert documents',
--     'Enable insert for authenticated users',
--     'Enable select for authenticated users',
--     'Enable update for authenticated users',
--     'Enable delete for authenticated users'
--   )
-- ORDER BY tablename, policyname;
-- Expected: 0 rows returned.

-- Full policy audit (confirm only Phase 1 canonical names survive):
-- SELECT tablename, policyname, cmd, roles
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;

DO $$
BEGIN
    RAISE NOTICE 'phase1_006 complete: vault columns added, legacy policies removed.';
END $$;
