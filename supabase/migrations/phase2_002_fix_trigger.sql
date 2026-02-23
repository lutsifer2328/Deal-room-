-- Drop the old trigger
DROP TRIGGER IF EXISTS sync_role_to_auth ON public.users;
-- Recreate the function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.sync_profile_to_auth() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public,
    auth AS $$ BEGIN -- We ONLY care about role or status changes
    IF TG_OP = 'UPDATE' THEN IF NEW.role IS DISTINCT
FROM OLD.role
    OR NEW.is_active IS DISTINCT
FROM OLD.is_active THEN
UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', NEW.role, 'is_active', NEW.is_active)
WHERE id = NEW.id;
END IF;
END IF;
RETURN NEW;
END;
$$;
-- Recreate the trigger
CREATE TRIGGER sync_role_to_auth
AFTER
UPDATE OF role,
    is_active ON public.users FOR EACH ROW EXECUTE FUNCTION public.sync_profile_to_auth();