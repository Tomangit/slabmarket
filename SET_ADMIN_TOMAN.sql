-- Set user "Toman" as admin
-- This script finds the user by name or email and sets their role to 'admin'

-- First, let's see what users match "Toman"
SELECT id, full_name, email, role 
FROM public.profiles 
WHERE LOWER(full_name) LIKE '%toman%' 
   OR LOWER(email) LIKE '%toman%';

-- Update the role to admin
-- Replace 'USER_ID_HERE' with the actual ID from the query above
-- Or use this if you're sure about the user:
UPDATE public.profiles 
SET role = 'admin'
WHERE LOWER(full_name) LIKE '%toman%' 
   OR LOWER(email) LIKE '%toman%';

-- Verify the update
SELECT id, full_name, email, role 
FROM public.profiles 
WHERE role = 'admin';

