-- Compare Auth ID vs Public ID for 'lutsifer@gmail.com'

SELECT 
    au.id AS auth_id,
    pu.id AS public_id,
    au.email,
    (au.id = pu.id) AS ids_match
FROM auth.users au
FULL OUTER JOIN public.users pu ON au.email = pu.email
WHERE au.email = 'lutsifer@gmail.com' OR pu.email = 'lutsifer@gmail.com';
