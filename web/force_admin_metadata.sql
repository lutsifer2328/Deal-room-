-- FORCE SYNC METADATA FOR ADMIN
-- Run this in Supabase SQL Editor

UPDATE auth.users
SET raw_user_meta_data = 
  COALESCE(raw_user_meta_data, '{}'::jsonb) || 
  jsonb_build_object(
    'role', 'admin', 
    'full_name', 'Admin User',
    'name', 'Admin User'
  )
WHERE email ILIKE '%lutsifer%';

-- Verify it worked
SELECT email, raw_user_meta_data 
FROM auth.users 
WHERE email ILIKE '%lutsifer%';
