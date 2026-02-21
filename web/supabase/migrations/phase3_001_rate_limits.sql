-- Phase 3: Rate Limiting Schema

CREATE TABLE IF NOT EXISTS public.rate_limits (
    key text PRIMARY KEY,
    count int NOT NULL DEFAULT 1,
    window_start timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for cleanup performance
CREATE INDEX IF NOT EXISTS idx_rate_limits_updated_at ON public.rate_limits(updated_at);

-- Cleanup function to remove old entries (can be called periodically or via cron)
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
    DELETE FROM public.rate_limits
    WHERE updated_at < now() - interval '1 hour';
$$;

-- Grant access to service_role (and potentially postgres)
GRANT ALL ON public.rate_limits TO service_role;
GRANT ALL ON public.rate_limits TO postgres;

-- Explicitly revoke from anon/authenticated (internal use only via service role in Actions)
REVOKE ALL ON public.rate_limits FROM anon, authenticated;
