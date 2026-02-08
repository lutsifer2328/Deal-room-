-- SYNC METADATA: Update auth.users metadata from public.users
-- This ensures that session.user.user_metadata has the correct role (Backup for Client)

UPDATE auth.users
SET raw_user_meta_data = 
  COALESCE(raw_user_meta_data, '{}'::jsonb) || 
  jsonb_build_object(
    'role', public.users.role, 
    'full_name', public.users.name,
    'requires_password_change', public.users.requires_password_change
  )
FROM public.users
WHERE auth.users.id = public.users.id
AND public.users.email ILIKE '%lutsifer%';

-- Verify the update
SELECT id, email, raw_user_meta_data FROM auth.users WHERE email ILIKE '%lutsifer%';
