-- Weryfikacja migracji - sprawdź czy kolumny zostały dodane
-- Uruchom to zapytanie w Supabase SQL Editor po wykonaniu migracji

SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'slabs'
  AND column_name IN (
    'first_edition', 
    'shadowless', 
    'pokemon_center_edition', 
    'prerelease', 
    'staff', 
    'tournament_card', 
    'error_card'
  )
ORDER BY column_name;

-- Sprawdź czy indeks został utworzony
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'slabs'
  AND indexname = 'idx_slabs_edition_variants';

