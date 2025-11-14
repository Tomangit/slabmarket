# Instrukcja uruchomienia migracji z polami edycji kart

## Opcja 1: Supabase Dashboard (najprostsza - zalecana)

1. Otwórz https://supabase.com/dashboard
2. Wybierz swój projekt (xxsnsomathouvuhtshyw)
3. Przejdź do **SQL Editor** w menu bocznym
4. Kliknij **New query**
5. Skopiuj całą zawartość pliku `supabase/migrations/20250114_add_slab_edition_fields.sql`
6. Wklej do edytora SQL
7. Kliknij **Run** (lub naciśnij Ctrl+Enter)

Migracja doda następujące kolumny do tabeli `slabs`:
- `first_edition` (boolean)
- `shadowless` (boolean)
- `pokemon_center_edition` (boolean)
- `prerelease` (boolean)
- `staff` (boolean)
- `tournament_card` (boolean)
- `error_card` (boolean)

## Opcja 2: Supabase CLI (dla zaawansowanych)

### Instalacja CLI

```bash
# Windows (PowerShell)
npm install -g supabase

# Lub użyj Scoop
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Login i link projektu

```bash
# Zaloguj się
supabase login

# Połącz z projektem
supabase link --project-ref xxsnsomathouvuhtshyw
```

### Wdrożenie migracji

```bash
# Z katalogu głównego projektu
cd c:\Users\tjedr\SM

# Wdróż wszystkie migracje
supabase db push

# Lub wdróż tylko tę migrację
supabase migration up
```

## Weryfikacja

Po uruchomieniu migracji, sprawdź czy kolumny zostały dodane:

1. W Supabase Dashboard, przejdź do **Table Editor**
2. Wybierz tabelę `slabs`
3. Sprawdź czy widzisz nowe kolumny: `first_edition`, `shadowless`, `pokemon_center_edition`, etc.

Lub uruchom zapytanie SQL:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'slabs'
  AND column_name IN ('first_edition', 'shadowless', 'pokemon_center_edition', 'prerelease', 'staff', 'tournament_card', 'error_card');
```

## Uwagi

- Migracja używa `IF NOT EXISTS`, więc można ją uruchomić bezpiecznie wielokrotnie
- Wszystkie nowe kolumny mają domyślną wartość `false`
- Utworzony zostanie indeks dla optymalizacji zapytań filtrujących po wariantach edycji

