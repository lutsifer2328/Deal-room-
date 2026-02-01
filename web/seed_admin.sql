-- Create a seed ADMIN user so you can log in immediately.
-- REPLACE 'your-email@example.com' and 'your-password' with your real desired credentials.

-- -------- COPY FROM HERE --------
-- 1. Create Identity in Auth System
-------- COPY FROM HERE --------
-- 1. Create Identity in Auth System
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  uuid_generate_v4(),
  'authenticated',
  'authenticated',
  'lutsifer@gmail.com',  -- YOUR EMAIL
  crypt('admin123', gen_salt('bf')), -- DEFAULT PASSWORD (change after login if you want)
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"System Admin"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- 2. Create Public Profile
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  SELECT id INTO new_user_id FROM auth.users WHERE email = 'lutsifer@gmail.com';
  
  -- Force update/insert to be Admin
  INSERT INTO public.users (id, email, name, role, is_active)
  VALUES (new_user_id, 'lutsifer@gmail.com', 'System Admin', 'admin', true)
  ON CONFLICT (id) DO UPDATE 
  SET role = 'admin', is_active = true;
END $$;
-------- END COPY --------
