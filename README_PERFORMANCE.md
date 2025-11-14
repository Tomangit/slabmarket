# Optymalizacje wydajności - Slab Market

Ten dokument opisuje optymalizacje wydajności wprowadzone w projekcie Slab Market.

## 1. Optymalizacja obrazów

### Next.js Image Component
- Zastąpiono wszystkie tagi `<img>` komponentem `Image` z Next.js
- Automatyczna optymalizacja obrazów (WebP, AVIF)
- Lazy loading dla obrazów poniżej folda
- Placeholder blur dla lepszego UX
- Responsive sizing z właściwymi `sizes` attributes

### Lokalizacje zmian:
- `src/pages/index.tsx` - SlabCard component
- `src/pages/slab/[id].tsx` - główny obraz slab
- `src/pages/marketplace.tsx` - CardListingCard component
- `src/pages/transaction/[id].tsx` - obraz transakcji
- `src/pages/dashboard.tsx` - obrazy w dashboard

### Konfiguracja Next.js
- `next.config.mjs` - skonfigurowano `remotePatterns` dla zewnętrznych domen (Supabase Storage)

## 2. Indeksy bazy danych

### Migracja: `20250117_add_performance_indexes.sql`

Dodano następujące indeksy dla optymalizacji zapytań:

#### Tabela `slabs`:
- `idx_slabs_status_created_at` - status i data utworzenia (homepage, marketplace)
- `idx_slabs_status_price` - status i cena (filtrowanie po cenie)
- `idx_slabs_category_status` - kategoria i status
- `idx_slabs_grading_company_status` - firma gradingowa i status
- `idx_slabs_grade_status` - ocena i status
- `idx_slabs_seller_status` - sprzedawca i status (dashboard)
- `idx_slabs_listing_type_status` - typ listingu (featured listings)
- `idx_slabs_popularity` - popularność (watchlist_count, views)
- `idx_slabs_filters_composite` - złożony indeks dla częstych kombinacji filtrów

#### Tabela `cards`:
- `idx_cards_name_search` - wyszukiwanie po nazwie (GIN index z pg_trgm)
- `idx_cards_set_name` - filtrowanie po nazwie setu

#### Tabela `transactions`:
- `idx_transactions_buyer` - transakcje kupującego
- `idx_transactions_seller` - transakcje sprzedawcy
- `idx_transactions_status` - status transakcji
- `idx_transactions_slab` - powiązanie z slab

#### Inne tabele:
- `idx_watchlists_user_created` - watchlist użytkownika
- `idx_notifications_user_read` - powiadomienia użytkownika
- `idx_reviews_transaction` - recenzje transakcji
- `idx_price_history_slab_date` - historia cen

### Rozszerzenie pg_trgm
- Włączono rozszerzenie `pg_trgm` dla zaawansowanego wyszukiwania tekstowego

## 3. Cache na poziomie API

### Implementacja: `src/lib/cache.ts`

Prosty cache w pamięci dla odpowiedzi API:
- Maksymalna liczba wpisów: 100
- Domyślny TTL: 5 minut
- Automatyczne czyszczenie wygasłych wpisów
- Singleton pattern dla globalnego dostępu

### Użycie:
```typescript
import { cache, createCacheKey } from "@/lib/cache";

// W serwisie
const cacheKey = createCacheKey("slabs", filters);
const cached = cache.get(cacheKey);
if (cached) return cached;

const data = await fetchData();
cache.set(cacheKey, data, 5 * 60 * 1000); // 5 minut
return data;
```

## 4. Optymalizacja komponentów React

### React.memo
- `SlabCard` w `src/pages/index.tsx` - zapobiega niepotrzebnym re-renderom
- `CardListingCard` w `src/pages/marketplace.tsx` - optymalizacja dla list

### useMemo i useCallback
- Używane w `src/pages/marketplace.tsx` dla `loadCards` callback
- Memoizacja filtrów i wyników wyszukiwania

## 5. Optymalizacje zapytań

### Server-side pagination
- Paginacja po stronie serwera zamiast client-side
- Limit 100 rekordów na stronę
- Sortowanie po stronie bazy danych

### Selektywne pobieranie danych
- Używanie `.select()` z konkretnymi polami
- Unikanie pobierania niepotrzebnych danych
- Lazy loading dla powiązanych danych

## 6. Następne kroki

### Planowane optymalizacje:
1. **Redis/Upstash** - cache po stronie serwera
2. **CDN** - dla statycznych assetów i obrazów
3. **Database connection pooling** - optymalizacja połączeń z bazą
4. **Query batching** - grupowanie zapytań
5. **Incremental Static Regeneration (ISR)** - dla stron marketplace
6. **Service Worker** - cache po stronie klienta
7. **Image optimization** - kompresja i konwersja formatów

## 7. Monitoring wydajności

### Metryki do monitorowania:
- Czas ładowania stron
- Czas odpowiedzi API
- Wykorzystanie cache
- Liczba zapytań do bazy danych
- Rozmiar odpowiedzi API
- Czas renderowania komponentów

### Narzędzia:
- Sentry - monitoring błędów i wydajności
- Vercel Analytics - metryki strony
- Supabase Dashboard - monitoring zapytań

## 8. Uruchomienie migracji

Aby zastosować indeksy wydajnościowe:

```sql
-- W Supabase SQL Editor
-- Skopiuj zawartość pliku:
-- supabase/migrations/20250117_add_performance_indexes.sql
-- i wykonaj w Supabase Dashboard
```

Lub przez Supabase CLI:

```bash
supabase db push
```

## 9. Weryfikacja

Sprawdź, czy indeksy zostały utworzone:

```sql
-- Lista wszystkich indeksów dla tabeli slabs
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'slabs' 
ORDER BY indexname;
```

## 10. Uwagi

- Indeksy mogą spowolnić operacje INSERT/UPDATE/DELETE
- Monitoruj użycie indeksów za pomocą `EXPLAIN ANALYZE`
- Regularnie analizuj i optymalizuj zapytania
- Rozważ partycjonowanie tabel dla dużych zbiorów danych

