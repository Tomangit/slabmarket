# Naprawa importu kart - instrukcje

## Problem

Po imporcie wykryto 3 główne problemy:

1. **Uszkodzone ID setów** - wiele setów ma nieprawidłowe ID (np. `english--lack-and-hite` zamiast `bw1`)
2. **Duplikaty setów** - te same sety występują z różnymi ID
3. **Brakujące karty 31-99** w 4 setach SWSH:
   - Astral Radiance
   - Brilliant Stars  
   - Lost Origin
   - Silver Tempest

## Rozwiązanie

### Krok 1: Naprawa duplikatów i uszkodzonych ID setów

Uruchom migrację SQL która:
- Usuwa duplikaty setów (zostawia te z poprawnymi PokemonTCG API ID)
- Aktualizuje karty wskazujące na usunięte sety
- Usuwa sety z uszkodzonymi ID

```bash
# W Supabase Dashboard -> SQL Editor uruchom:
# supabase/migrations/20250217_fix_duplicate_sets_and_remove_broken_ids.sql
```

Lub przez CLI:
```bash
supabase db push
```

### Krok 2: Weryfikacja po naprawie

Sprawdź czy duplikaty zostały usunięte:

```sql
-- Sprawdź czy są jeszcze duplikaty
SELECT name, language, COUNT(*) as cnt
FROM public.sets
GROUP BY name, language
HAVING COUNT(*) > 1;
```

Powinno zwrócić 0 wierszy.

### Krok 3: Naprawa ID setów używając PokemonTCG API

Uruchom skrypt który naprawi wszystkie ID setów na poprawne PokemonTCG API ID:

```bash
node scripts/fix-sets-ids.mjs
```

Ten skrypt:
- Pobiera wszystkie sety z PokemonTCG API
- Mapuje sety z bazy na API używając znormalizowanych nazw
- Aktualizuje ID setów na poprawne (np. `swsh10`, `xy7`, `bw1`)

### Krok 4: Reimport brakujących kart 31-99

Problem: W 4 setach SWSH import pobrał tylko karty Trainer Gallery (TG01-TG30), pomijając główne karty (31-99).

**Przyczyna:** Te sety mają osobne subsety "Trainer Gallery" które zostały zaimportowane zamiast głównych setów.

**Rozwiązanie:** Reimport głównych setów (bez subsetów Trainer Gallery).

#### Opcja A: Reimport przez skrypt (zalecane)

```bash
# Reimport tylko tych 4 setów
node scripts/import-single-set.mjs "Astral Radiance"
node scripts/import-single-set.mjs "Brilliant Stars"
node scripts/import-single-set.mjs "Lost Origin"
node scripts/import-single-set.mjs "Silver Tempest"
```

**Uwaga:** Skrypt automatycznie:
- Sprawdza istniejące karty i nie duplikuje ich
- Pobiera wszystkie karty z API (włącznie z 31-99)
- Aktualizuje tylko nowe karty

#### Opcja B: Ręczne usunięcie i reimport

Jeśli chcesz usunąć istniejące karty i zaimportować wszystko od nowa:

```sql
-- Usuń karty z tych setów (TYLKO jeśli chcesz pełny reimport)
DELETE FROM public.cards
WHERE set_name IN ('Astral Radiance', 'Brilliant Stars', 'Lost Origin', 'Silver Tempest');
```

Następnie uruchom reimport jak w Opcji A.

### Krok 5: Weryfikacja końcowa

Sprawdź czy wszystkie karty zostały zaimportowane:

```sql
-- Sprawdź liczbę kart w każdym secie
SELECT 
  set_name,
  COUNT(*) as total_cards,
  COUNT(*) FILTER (WHERE regexp_replace(card_number, '[^0-9]', '', 'g')::int BETWEEN 1 AND 30) as cnt_1_30,
  COUNT(*) FILTER (WHERE regexp_replace(card_number, '[^0-9]', '', 'g')::int BETWEEN 31 AND 99) as cnt_31_99
FROM public.cards
WHERE set_name IN ('Astral Radiance', 'Brilliant Stars', 'Lost Origin', 'Silver Tempest')
GROUP BY set_name
ORDER BY set_name;
```

Oczekiwany wynik:
- `cnt_1_30` - karty Trainer Gallery (TG01-TG30)
- `cnt_31_99` - główne karty setu (31-99)
- `total_cards` - suma obu (powinno być ~72-100 kart na set)

### Krok 6: Sprawdź czy nie ma innych brakujących kart

```sql
-- Znajdź sety z podejrzanie małą liczbą kart
SELECT 
  c.set_name,
  COUNT(*) as cards_count,
  s.name as set_name_in_sets_table
FROM public.cards c
LEFT JOIN public.sets s ON s.name = c.set_name
GROUP BY c.set_name, s.name
HAVING COUNT(*) < 20  -- Sety z mniej niż 20 kartami (możliwe braki)
ORDER BY cards_count ASC;
```

## Uwagi

1. **Backup przed migracją:** Zrób backup bazy przed uruchomieniem migracji SQL
2. **Czas importu:** Reimport 4 setów może zająć 10-30 minut (zależnie od API rate limits)
3. **API Key:** Upewnij się że masz `POKEMON_TCG_API_KEY` w `.env` dla szybszego importu
4. **Trainer Gallery:** Karty TG01-TG30 są poprawne - nie usuwaj ich, tylko dodaj brakujące 31-99

## Troubleshooting

### Problem: Skrypt `fix-sets-ids.mjs` nie znajduje niektórych setów

**Rozwiązanie:** Niektóre sety mogą nie istnieć w PokemonTCG API (np. bardzo stare lub specjalne promocje). Te sety pozostaną z obecnymi ID.

### Problem: Reimport nie pobiera kart 31-99

**Możliwe przyczyny:**
1. API nie zwraca tych kart (sprawdź ręcznie w PokemonTCG API)
2. Karty mają inne numery (nie 31-99, ale np. 31a, 32a, etc.)
3. Są w osobnym subsecie który trzeba zaimportować osobno

**Sprawdź ręcznie:**
```bash
# Sprawdź co zwraca API dla setu
curl "https://api.pokemontcg.io/v2/cards?q=set.id:swsh10" | jq '.data[] | select(.number | test("^3[1-9]|^[4-9][0-9]")) | {name, number}'
```

### Problem: Duplikaty kart po reimporcie

**Rozwiązanie:** Skrypt automatycznie deduplikuje karty używając UUID opartego na `name + set_name + card_number`. Duplikaty nie powinny się pojawić.

## Status

- [x] Migracja SQL do naprawy duplikatów
- [x] Instrukcje reimportu
- [ ] Uruchomienie migracji
- [ ] Reimport brakujących kart
- [ ] Weryfikacja końcowa






