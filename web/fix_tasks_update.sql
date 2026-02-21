BEGIN;

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Ensure an UPDATE policy exists for tasks that allows Staff AND Deal Members
-- to update a task (such as its status)
DROP POLICY IF EXISTS "tasks_update_policy" ON public.tasks;

CREATE POLICY "tasks_update_policy" ON public.tasks FOR UPDATE TO authenticated USING (
    -- Admins / Lawyers / Staff can update
    public.is_staff()
    OR
    -- Deal Members can update tasks in their deal (e.g., status to under_review)
    public.is_deal_member(deal_id)
) WITH CHECK (
    public.is_staff()
    OR
    public.is_deal_member(deal_id)
);

COMMIT;
