BEGIN;

DROP POLICY IF EXISTS "tasks_select_policy" ON public.tasks;

-- Master Spec § 5.3 Compliant
-- Prevent infinite recursion by never querying public.users directly
-- Rely solely on public.is_staff() and public.is_deal_member()
CREATE POLICY "tasks_select_policy" ON public.tasks FOR SELECT TO authenticated USING (
    public.is_staff() 
    OR 
    public.is_deal_member(deal_id)
);

COMMIT;
