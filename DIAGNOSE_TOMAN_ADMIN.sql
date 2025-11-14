-- Step 1: Sprawdź czy kolumna role istnieje w tabeli profiles
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name = 'role';

-- Step 2: Sprawdź wszystkich użytkowników i ich role
SELECT id, full_name, email, role, created_at
FROM public.profiles
ORDER BY created_at DESC;

-- Step 3: Sprawdź użytkownika po emailu (jeśli istnieje)
SELECT id, full_name, email, role
FROM public.profiles
WHERE email = 'toman1994@gmail.com';

-- Step 4: Sprawdź użytkowników w auth.users (aby znaleźć ID)
SELECT id, email, created_at
FROM auth.users
WHERE email = 'toman1994@gmail.com';

-- Step 5: Jeśli znajdziesz ID użytkownika, użyj tego do UPDATE:
-- UPDATE public.profiles 
-- SET role = 'admin'
-- WHERE id = 'TUTAJ_WKLEJ_ID_Z_KROKU_4';

