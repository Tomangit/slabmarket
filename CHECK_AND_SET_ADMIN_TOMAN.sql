-- Step 1: Check all users to find "Toman"
SELECT id, full_name, email, role, created_at
FROM public.profiles
ORDER BY created_at DESC;

-- Step 2: If you see the user, update by ID (replace 'USER_ID_HERE' with actual ID)
-- UPDATE public.profiles 
-- SET role = 'admin'
-- WHERE id = 'USER_ID_HERE';

-- Step 3: Or update by email if you know it
-- UPDATE public.profiles 
-- SET role = 'admin'
-- WHERE email = 'toman1994@gmail.com';

-- Step 4: Verify admin was set
SELECT id, full_name, email, role 
FROM public.profiles 
WHERE role = 'admin';

