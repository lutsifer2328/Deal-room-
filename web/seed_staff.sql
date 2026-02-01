-- Create a seed LAWYER/STAFF user manually to bypass email rate limits.
-- REPLACE 'lawyer@agenzia.com' and 'lawyer123' with your desired credentials.

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
  'mgeorgieva@agenzia.bg', -- CHANGE THIS
  crypt('lawyer123', gen_salt('bf')), -- CHANGE THIS
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Maria Georgieva"}',
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
  SELECT id INTO new_user_id FROM auth.users WHERE email = 'mgeorgieva@agenzia.bg';
  
  -- Force update/insert to be LAWYER
  INSERT INTO public.users (id, email, name, role, is_active)
  VALUES (new_user_id, 'mgeorgieva@agenzia.bg', 'Maria Georgieva', 'lawyer', true)
  ON CONFLICT (id) DO UPDATE 
  SET role = 'lawyer', is_active = true;
END $$;
