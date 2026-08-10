-- =========================================
-- phase8_007_sync_finance_to_metadata.sql
-- Include finance fields in the auth-metadata sync so the client's
-- metadata-fallback path (when the DB profile fetch aborts) still knows the
-- user's finance access. Otherwise a transient fetch failure shows "Restricted"
-- to a real finance manager. Then re-sync all existing users once.
-- =========================================

create or replace function public.sync_user_to_metadata()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
BEGIN
    UPDATE auth.users
    SET raw_user_meta_data =
        COALESCE(raw_user_meta_data, '{}'::jsonb) ||
        jsonb_build_object(
            'role', NEW.role,
            'full_name', NEW.name,
            'name', NEW.name,
            'email', NEW.email,
            'requires_password_change', NEW.requires_password_change,
            'finance_access', NEW.finance_access,
            'department', NEW.department,
            'default_commission_pct', NEW.default_commission_pct
        )
    WHERE id = NEW.id;
    RETURN NEW;
END;
$function$;

-- Backfill: fire the sync for every existing user (no finance field changes, so
-- the guard trigger is untouched; runs elevated so it is permitted).
update public.users set role = role;
