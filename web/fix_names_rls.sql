BEGIN;

-- Helper: Check if current user shares a Deal with another user via deal_participants
CREATE OR REPLACE FUNCTION public.shares_deal_with_user(target_user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER -- Bypasses RLS to prevent infinite recursion
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.deal_participants dp1
        JOIN public.deal_participants dp2 ON dp1.deal_id = dp2.deal_id
        JOIN public.participants p1 ON p1.id = dp1.participant_id
        JOIN public.participants p2 ON p2.id = dp2.participant_id
        WHERE p1.user_id = auth.uid()
          AND p2.user_id = target_user_id
    );
END;
$$ LANGUAGE plpgsql;

-- Helper: Check if current user shares a Deal with a specific global participant record
CREATE OR REPLACE FUNCTION public.shares_deal_with_participant(target_participant_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER -- Bypasses RLS to prevent infinite recursion
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.deal_participants dp1
        JOIN public.deal_participants dp2 ON dp1.deal_id = dp2.deal_id
        JOIN public.participants p1 ON p1.id = dp1.participant_id
        WHERE p1.user_id = auth.uid()
          AND dp2.participant_id = target_participant_id
    );
END;
$$ LANGUAGE plpgsql;


-- 1. Unblock public.users securely
DROP POLICY IF EXISTS "users_select_policy" ON public.users;
CREATE POLICY "users_select_policy" ON public.users FOR SELECT TO authenticated USING (
    id = auth.uid()
    OR
    public.is_staff()
    OR
    public.shares_deal_with_user(id)
);

-- 2. Unblock public.participants securely
DROP POLICY IF EXISTS "participants_select_policy" ON public.participants;
CREATE POLICY "participants_select_policy" ON public.participants FOR SELECT TO authenticated USING (
    user_id = auth.uid()
    OR
    public.is_staff()
    OR
    public.shares_deal_with_participant(id)
);

COMMIT;
