-- Ustaw admina dla użytkownika Toman używając jego ID
UPDATE public.profiles 
SET role = 'admin'
WHERE id = 'd10db666-8094-4969-87ad-fce92384c9a1';

-- Sprawdź czy się udało
SELECT id, full_name, email, role 
FROM public.profiles 
WHERE id = 'd10db666-8094-4969-87ad-fce92384c9a1';

-- Jeśli użytkownik nie ma jeszcze wpisu w profiles, utwórz go:
-- INSERT INTO public.profiles (id, email, role)
-- VALUES ('d10db666-8094-4969-87ad-fce92384c9a1', 'toman1994@gmail.com', 'admin')
-- ON CONFLICT (id) DO UPDATE SET role = 'admin';

