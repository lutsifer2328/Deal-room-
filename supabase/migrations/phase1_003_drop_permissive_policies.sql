-- =========================================
-- phase1_003_drop_permissive_policies.sql
-- Remove ALL permissive/anon/public allow-all policies (safe, idempotent)
-- This uses DROP POLICY IF EXISTS — completely non-destructive
-- =========================================

-- Drop ALL existing policies on public tables (nuclear reset for clean slate)
do $$
declare r record;
begin
  for r in (
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'users','participants','deal_participants','deals','tasks','documents',
        'standard_documents','audit_logs','agency_contracts','client_notes'
      )
  ) loop
    execute format('drop policy if exists %I on %I.%I;', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

-- Drop ALL existing storage policies on storage.objects (clean slate for documents bucket)
do $$
declare r record;
begin
  for r in (
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
  ) loop
    execute format('drop policy if exists %I on %I.%I;', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

-- =========================================
-- VERIFICATION (run after executing)
-- =========================================
-- Should return 0 rows for public tables:
-- select schemaname, tablename, policyname, cmd, roles, qual
-- from pg_policies
-- where schemaname in ('public','storage')
-- order by schemaname, tablename;

-- =========================================
-- ROLLBACK: To recreate the old permissive policies (if needed for emergency):
-- =========================================
-- CREATE POLICY "Enable insert for authenticated users" ON public.participants FOR INSERT TO authenticated WITH CHECK (true);
-- CREATE POLICY "Enable select for authenticated users" ON public.participants FOR SELECT TO authenticated USING (true);
-- CREATE POLICY "Enable update for authenticated users" ON public.participants FOR UPDATE TO authenticated USING (true);
-- CREATE POLICY "Enable insert for authenticated users" ON public.deal_participants FOR INSERT TO authenticated WITH CHECK (true);
-- CREATE POLICY "Enable select for authenticated users" ON public.deal_participants FOR SELECT TO authenticated USING (true);
-- CREATE POLICY "Enable update for authenticated users" ON public.deal_participants FOR UPDATE TO authenticated USING (true);
-- CREATE POLICY "Enable delete for authenticated users" ON public.deal_participants FOR DELETE TO authenticated USING (true);
-- CREATE POLICY "Authenticated users can view deals" ON deals FOR SELECT TO authenticated USING (true);
-- CREATE POLICY "Authenticated users can create deals" ON deals FOR INSERT TO authenticated WITH CHECK (true);
-- CREATE POLICY "Authenticated users can update/delete deals" ON deals FOR ALL TO authenticated USING (true);
