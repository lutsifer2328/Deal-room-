-- Fix the handle_new_user trigger to honor role and is_active provided in metadata
-- This version uses safe null-checks for raw_user_meta_data to prevent crashes during auth creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    meta_role text;
    final_role text;
    meta_name text;
    meta_active_str text;
    meta_active boolean;
BEGIN
    -- Safe extraction from JSONB (handles NULL raw_user_meta_data gracefully)
    meta_role := new.raw_user_meta_data->>'role';
    meta_name := new.raw_user_meta_data->>'name';
    meta_active_str := new.raw_user_meta_data->>'is_active';
    
    -- Extract is_active safely
    IF meta_active_str IS NOT NULL THEN
        meta_active := meta_active_str::boolean;
    ELSE
        -- Admin created internal users should be active. Others maybe true by default.
        meta_active := true; 
    END IF;

    -- Determine final role with validation
    -- If meta_role is valid organizational role or 'user', use it. Else fallback to 'user'
    IF meta_role IN ('admin', 'lawyer', 'staff', 'user', 'broker') THEN
        final_role := meta_role;
    ELSE
        final_role := 'user';
    END IF;

    -- Ensure we don't crash if name is missing
    IF meta_name IS NULL OR meta_name = '' THEN
        meta_name := split_part(new.email, '@', 1);
    END IF;

    -- Insert into public.users
    INSERT INTO public.users (
        id, 
        email, 
        name, 
        role, 
        avatar_url,
        is_active,
        requires_password_change
    )
    VALUES (
        new.id, 
        new.email, 
        meta_name, 
        final_role::public.app_role, 
        new.raw_user_meta_data->>'avatar_url',
        meta_active,
        -- Force password change for new users created by admin
        true 
    );
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
