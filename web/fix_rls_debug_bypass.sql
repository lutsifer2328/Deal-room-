-- DEBUG RLS (Bypass Mode)
-- Allows upload BUT logs the decision logic
-- Use this to see WHY strict rules fail (without rollback hiding logs)

-- 1. Log Table (Ensure exists)
CREATE TABLE IF NOT EXISTS public.rls_debug_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    timestamp timestamptz DEFAULT now(),
    message text,
    user_id uuid
);
ALTER TABLE public.rls_debug_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all to insert logs" ON public.rls_debug_logs;
CREATE POLICY "Allow all to insert logs" ON public.rls_debug_logs FOR INSERT TO authenticated, service_role WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all to select logs" ON public.rls_debug_logs;
CREATE POLICY "Allow all to select logs" ON public.rls_debug_logs FOR SELECT TO authenticated, service_role USING (true);

-- 2. Debug Function
CREATE OR REPLACE FUNCTION public.log_rls_check(msg text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.rls_debug_logs (message, user_id) VALUES (msg, auth.uid());
    RETURN true; 
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_rls_check TO authenticated;

-- 3. PERMISSIVE Policy with Logging
DROP POLICY IF EXISTS "Strict upload access" ON storage.objects;
CREATE POLICY "Strict upload access"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    -- Log EVERYTHING
    public.log_rls_check(
        'Upload Attempt: ' ||
        ' Bucket=' || bucket_id || 
        ' Name=' || name || 
        ' Auth=' || auth.uid()::text ||
        ' DealID=' || coalesce(public.try_cast_uuid(split_part(name, '/', 1))::text, 'NULL') ||
        ' IsParticipant=' || (
            EXISTS (
                SELECT 1 FROM public.deal_participants dp
                JOIN public.participants p ON dp.participant_id = p.id
                WHERE dp.deal_id = public.try_cast_uuid(split_part(name, '/', 1))
                AND p.user_id = auth.uid()
            )
        )::text ||
        ' IsInternal=' || public.is_internal()::text
    )
    -- AND... always return true to allow logs to persist
    AND true
);

-- Ensure View is also accessible for the script to verify upload
DROP POLICY IF EXISTS "Strict view access" ON storage.objects;
CREATE POLICY "Strict view access"
ON storage.objects FOR SELECT
TO authenticated
USING (true); -- Open for debug

DO $$
BEGIN
    RAISE NOTICE 'Debug Bypass Applied. Logs will be saved.';
END $$;
