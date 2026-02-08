-- CLEANUP: Remove old/duplicate policies that conflict with our new role-based security
-- We want to ensure ONLY Admins/Lawyers/Staff can create/edit deals.

-- Drop the permissive "Allow all authenticated users" policies for deals
DROP POLICY IF EXISTS "Authenticated users can create deals" ON public.deals;
DROP POLICY IF EXISTS "Authenticated users can update/delete deals" ON public.deals;

-- Note: We Keeping "Authenticated users can view deals" (SELECT) as that is likely needed for read access.
-- If we were to replace it, we'd need a new SELECT policy. For now, assuming SELECT is fine for all authenticated.

-- Drop redundant audit_log policies if they exist and are too open
DROP POLICY IF EXISTS "Enable anon insert" ON public.audit_logs;
DROP POLICY IF EXISTS "Enable all access for authenticated users7" ON public.audit_logs;

-- Verification: Show cleaned state
SELECT tablename, policyname, cmd, roles 
FROM pg_policies 
WHERE tablename IN ('deals', 'audit_logs')
ORDER BY tablename, cmd;
