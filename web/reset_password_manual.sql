-- Reset password for lutsifer@gmail.com
-- Replace 'your-new-password-here' with your actual desired password

-- This will hash and set the new password
UPDATE auth.users
SET 
    encrypted_password = crypt('your-new-password-here', gen_salt('bf')),
    updated_at = now()
WHERE email = 'lutsifer@gmail.com';

-- Verify the user
SELECT email, raw_user_meta_data->>'role' as role
FROM auth.users
WHERE email = 'lutsifer@gmail.com';
