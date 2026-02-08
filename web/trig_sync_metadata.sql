-- triggers/trig_sync_metadata.sql

-- Function to sync public user data to auth.users metadata
CREATE OR REPLACE FUNCTION public.sync_user_to_metadata()
RETURNS TRIGGER AS $$
BEGIN
    -- Update auth.users metadata
    -- We perform a deep merge or simple overwrite of specific keys
    UPDATE auth.users
    SET raw_user_meta_data = 
        COALESCE(raw_user_meta_data, '{}'::jsonb) || 
        jsonb_build_object(
            'role', NEW.role,
            'full_name', NEW.name,
            'name', NEW.name, -- Sync both for compatibility
            'email', NEW.email,
            'requires_password_change', NEW.requires_password_change
        )
    WHERE id = NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists to avoid conflicts
DROP TRIGGER IF EXISTS on_user_update_sync_metadata ON public.users;

-- Create Trigger
CREATE TRIGGER on_user_update_sync_metadata
AFTER UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_to_metadata();

-- Also handle Inserts? Usually inserts are handled by auth -> public, but manual inserts might happen
DROP TRIGGER IF EXISTS on_user_insert_sync_metadata ON public.users;

CREATE TRIGGER on_user_insert_sync_metadata
AFTER INSERT ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_to_metadata();

COMMENT ON FUNCTION public.sync_user_to_metadata IS 'Syncs public.users role/name changes to auth.users metadata for session fallback reliability.';
