-- =============================================================
-- HELPER_PERMISSIONS_FIX.sql
-- Run this in the Supabase SQL Editor to grant permissions.
-- =============================================================

BEGIN;

-- Grant execute on helper functions to authenticated role
-- These functions use SECURITY DEFINER so they can access public tables
-- But the authenticated role MUST have permission to call them.

GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_participant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_deal_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_upload_to_task(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_read_document_row(uuid) TO authenticated;

-- Ensure public schema is in search path
ALTER ROLE authenticated SET search_path TO public, auth, extensions;

COMMIT;
