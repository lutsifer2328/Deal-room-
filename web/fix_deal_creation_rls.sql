-- Fix RLS policies to allow Admins, Lawyers, and Staff to create deals
-- Based on directives/login.md: Admin, Lawyer, Staff can create deals.

-- 1. DEALS Table Policies
-- Drop existing restrictive policies if any (except the SELECT one which is usually fine, but let's be safe)
-- Note: We assume "Allow authenticated users to select deals" exists from previous fix.

DROP POLICY IF EXISTS "Allow internal staff to insert deals" ON public.deals;
DROP POLICY IF EXISTS "Allow internal staff to update deals" ON public.deals;
DROP POLICY IF EXISTS "Allow admins to delete deals" ON public.deals;

CREATE POLICY "Allow internal staff to insert deals"
ON public.deals FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('admin', 'lawyer', 'staff')
  )
);

CREATE POLICY "Allow internal staff to update deals"
ON public.deals FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('admin', 'lawyer', 'staff')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('admin', 'lawyer', 'staff')
  )
);

CREATE POLICY "Allow admins to delete deals"
ON public.deals FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('admin', 'lawyer')
  )
);

-- 2. AUDIT_LOGS Table Policies
-- Often overlooked: Creating a deal writes to audit_logs.
-- If no policy exists, the insert will fail silently or loudly.

DROP POLICY IF EXISTS "Allow authenticated to insert logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow internal staff to view logs" ON public.audit_logs;

CREATE POLICY "Allow authenticated to insert logs"
ON public.audit_logs FOR INSERT TO authenticated
WITH CHECK (true); -- Allow any authenticated user (even participants) to log actions if the app logic dictates

-- Verify policies
SELECT tablename, policyname, cmd, roles 
FROM pg_policies 
WHERE tablename IN ('deals', 'audit_logs');
