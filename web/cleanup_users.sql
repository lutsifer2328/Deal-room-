-- Cleanup Duplicate/Orphaned Users
-- This deletes users from 'public.users' that do NOT have a matching user in 'auth.users'
-- AND are duplicates by email.

DELETE FROM public.users
WHERE id NOT IN (SELECT id FROM auth.users)
AND email IN (
    SELECT email 
    FROM public.users 
    GROUP BY email 
    HAVING COUNT(*) > 1
);

-- Also delete any user explicitly named 'Unknown User' if they are not in auth
DELETE FROM public.users 
WHERE name = 'Unknown User' 
AND id NOT IN (SELECT id FROM auth.users);
