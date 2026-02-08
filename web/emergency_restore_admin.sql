-- EMERGENCY ADMIN RESTORE SCRIPT
-- Run this in Supabase SQL Editor if you are completely locked out.

-- 1. Verify User Exists
DO $$
DECLARE
    target_email TEXT := 'lutsifer2328@gmail.com'; -- REPLACE WITH YOUR EMAIL
    target_role TEXT := 'admin';
    user_id UUID;
BEGIN
    -- Find user in auth.users
    SELECT id INTO user_id FROM auth.users WHERE email = target_email;

    IF user_id IS NULL THEN
        RAISE EXCEPTION 'User % not found in auth.users', target_email;
    END IF;

    -- 2. Force Public Role Update
    UPDATE public.users 
    SET role = 'admin',
        is_active = true 
    WHERE id = user_id;

    -- 3. Force Metadata Update (The most critical part for our app)
    UPDATE auth.users
    SET raw_user_meta_data = 
        COALESCE(raw_user_meta_data, '{}'::jsonb) || 
        jsonb_build_object(
            'role', 'admin',
            'full_name', 'System Admin',
            'permissions', '["manage_users", "create_deals", "edit_deals", "close_deals", "manage_docs", "edit_timeline", "export_data"]'::jsonb
        )
    WHERE id = user_id;

    RAISE NOTICE 'SUCCESS: Admin access restored for %', target_email;
END $$;
