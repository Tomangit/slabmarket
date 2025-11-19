# Import Kart Pokemon w Wariantach Językowych

## Przegląd

Ten dokument opisuje, jak zaimportować karty Pokemon TCG w różnych wariantach językowych (europejskie i USA), pomijając wersje japońskie, koreańskie i chińskie.

## Obsługiwane Języki

- ✅ **English** (USA/Kanada/Wielka Brytania)
- ✅ **Polish** (Polska)
- ✅ **French** (Francja/Kanada)
- ✅ **German** (Niemcy/Austria)
- ✅ **Spanish** (Hiszpania/Ameryka Łacińska)
- ✅ **Italian** (Włochy)
- ✅ **Portuguese** (Portugalia/Brazylia)

## Pomijane Języki

- ❌ Japanese
- ❌ Korean
- ❌ Chinese

## Sposób 1: Automatyczny Import Wszystkich Języków

Użyj skryptu `import-multi-language.mjs`, który automatycznie importuje sety i karty dla wszystkich obsługiwanych języków:

```bash
node scripts/import-multi-language.mjs
```

Ten skrypt:
1. Importuje sety dla każdego języka
2. Importuje karty dla każdego języka
3. Wyświetla podsumowanie importu

## Sposób 2: Ręczny Import dla Pojedynczego Języka

### Krok 1: Import Setów

```bash
# Angielski (domyślny)
node scripts/import-pokemon-sets.mjs

# Polski
node scripts/import-pokemon-sets.mjs --language polish

# Francuski
node scripts/import-pokemon-sets.mjs --language french

# Niemiecki
node scripts/import-pokemon-sets.mjs --language german

# Hiszpański
node scripts/import-pokemon-sets.mjs --language spanish

# Włoski
node scripts/import-pokemon-sets.mjs --language italian

# Portugalski
node scripts/import-pokemon-sets.mjs --language portuguese
```

### Krok 2: Import Kart

```bash
# Angielski
node scripts/import-pokemon-cards.mjs --language english

# Polski
node scripts/import-pokemon-cards.mjs --language polish

# Francuski
node scripts/import-pokemon-cards.mjs --language french

# Niemiecki
node scripts/import-pokemon-cards.mjs --language german

# Hiszpański
node scripts/import-pokemon-cards.mjs --language spanish

# Włoski
node scripts/import-pokemon-cards.mjs --language italian

# Portugalski
node scripts/import-pokemon-cards.mjs --language portuguese
```

## Ważne Uwagi

1. **Nie trzeba kończyć obecnego importu** - możesz kontynuować import z dodatkowymi językami
2. **Skrypt automatycznie pomija sety, które już mają karty** - nie ma ryzyka duplikatów
3. **Każdy język jest importowany osobno** - możesz importować języki w dowolnej kolejności
4. **Pokemon TCG API może mieć ograniczenia** - między językami jest 5-sekundowa przerwa, aby uniknąć rate limiting

## Sprawdzanie Postępu

Możesz sprawdzić, ile kart zostało zaimportowanych dla każdego języka:

```sql
SELECT 
  s.language,
  COUNT(DISTINCT c.id) as card_count,
  COUNT(DISTINCT s.id) as set_count
FROM sets s
LEFT JOIN cards c ON c.set_name = s.name
GROUP BY s.language
ORDER BY s.language;
```

## Rozwiązywanie Problemów

### Problem: API zwraca błąd timeout

**Rozwiązanie**: Skrypt ma wbudowane retry logic. Jeśli problem się powtarza, spróbuj:
- Sprawdź połączenie internetowe
- Upewnij się, że masz ustawiony `POKEMON_TCG_API_KEY` w `.env`

### Problem: Niektóre języki nie mają setów

**Rozwiązanie**: Nie wszystkie sety są dostępne we wszystkich językach. To jest normalne - niektóre sety są dostępne tylko w wybranych językach.

### Problem: Duplikaty kart

**Rozwiązanie**: Skrypt używa `upsert` z `onConflict`, więc duplikaty są automatycznie pomijane. Każda karta jest identyfikowana przez unikalny `id` (UUID).

## Następne Kroki

Po zakończeniu importu:
1. Sprawdź, czy wszystkie języki zostały poprawnie zaimportowane
2. Zweryfikuj, że filtry językowe działają na stronie szczegółów karty
3. Upewnij się, że constraint w tabeli `sets` pozwala na wszystkie importowane języki

