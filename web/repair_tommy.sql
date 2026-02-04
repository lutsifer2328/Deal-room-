-- Sync Auth User to Public User for 'tommyignatov@yahoo.com'

INSERT INTO public.users (id, email, name, role, is_active, created_at)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'name', 'Tommy Vaskov') as name,
    (COALESCE(raw_user_meta_data->>'role', 'staff'))::app_role as role,
    true,
    created_at
FROM auth.users
WHERE email = 'tommyignatov@yahoo.com'
ON CONFLICT (id) DO UPDATE
SET 
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    is_active = true;

-- Verify result
SELECT * FROM public.users WHERE email = 'tommyignatov@yahoo.com';
