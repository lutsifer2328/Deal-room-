BEGIN;

-- Ensure an UPDATE policy exists for deal_participants that allows Staff to update permissions
DROP POLICY IF EXISTS "deal_participants_update_policy" ON public.deal_participants;

CREATE POLICY "deal_participants_update_policy" ON public.deal_participants FOR UPDATE TO authenticated USING (
    -- Only Admins, Lawyers, and Staff can update deal participants
    public.is_staff()
) WITH CHECK (
    public.is_staff()
);

COMMIT;
