-- DEBUG RLS (Deep Inspection)
-- Creates a logging table and modifies storage policy to log checks

-- 1. Create Log Table
CREATE TABLE IF NOT EXISTS public.rls_debug_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    timestamp timestamptz DEFAULT now(),
    message text,
    user_id uuid
);
ALTER TABLE public.rls_debug_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all to insert logs" ON public.rls_debug_logs FOR INSERT TO authenticated, service_role WITH CHECK (true);
CREATE POLICY "Allow all to select logs" ON public.rls_debug_logs FOR SELECT TO authenticated, service_role USING (true);

-- 2. Debug Function (Security Definer to ensure it can insert)
CREATE OR REPLACE FUNCTION public.log_rls_check(msg text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.rls_debug_logs (message, user_id) VALUES (msg, auth.uid());
    RETURN true; -- Always return true to act as a pass-through in AND conditions
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_rls_check TO authenticated;

-- 3. Modify Storage Policy to Verify Logic
DROP POLICY IF EXISTS "Strict upload access" ON storage.objects;
CREATE POLICY "Strict upload access"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    -- LOGGING
    public.log_rls_check('Check Upload: Bucket=' || bucket_id || ' Name=' || name || ' Auth=' || auth.uid()::text)
    
    AND bucket_id = 'documents' 
    AND (
        -- Log the Parse Result
        public.log_rls_check('Parsed Deal ID: ' || coalesce(public.try_cast_uuid(split_part(name, '/', 1))::text, 'NULL'))
        AND
        (
            EXISTS (
                SELECT 1 FROM public.deal_participants dp
                JOIN public.participants p ON dp.participant_id = p.id
                WHERE dp.deal_id = public.try_cast_uuid(split_part(name, '/', 1))
                AND p.user_id = auth.uid()
            )
            OR public.is_internal()
        )
    )
);

DO $$
BEGIN
    RAISE NOTICE 'Debug RLS Applied. Logs will appear in public.rls_debug_logs.';
END $$;
