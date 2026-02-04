-- Check status of the admin user
SELECT id, email, created_at FROM auth.users WHERE email = 'lutsifer@gmail.com';

SELECT * FROM public.users WHERE email = 'lutsifer@gmail.com';
