# Plan Migracji Bazy Danych Supabase

## 📋 Przegląd

Ten dokument opisuje krok po kroku proces migracji z obecnej bazy danych Supabase (`xxsnsomathouvuhtshyw`) do nowej bazy danych (`icuumgfjnjynbyqvzxwb`).

## 🔑 Nowe Dane Dostępu

- **URL**: `https://icuumgfjnjynbyqvzxwb.supabase.co`
- **Service Role Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljdXVtZ2Zqbmp5bmJ5cXZ6eHdiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzIwNTIwMiwiZXhwIjoyMDc4NzgxMjAyfQ.iBFD9FnrTwimo9nLEOktzMkY74Y5fSQpoPPl12I-3-w`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljdXVtZ2Zqbmp5bmJ5cXZ6eHdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMDUyMDIsImV4cCI6MjA3ODc4MTIwMn0.AYre-WMHdgxY6HIlCGiaORMELrAsDnZlHXg_xo3EGu4`

---

## 📝 Krok 1: Przygotowanie Nowej Bazy Danych

### 1.1. Sprawdzenie Dostępu
- [ ] Zaloguj się do Supabase Dashboard: https://supabase.com/dashboard/project/icuumgfjnjynbyqvzxwb
- [ ] Zweryfikuj, że masz dostęp do projektu
- [ ] Sprawdź ustawienia projektu (Settings → General)

### 1.2. Konfiguracja Podstawowa
- [ ] Sprawdź wersję PostgreSQL (powinna być 15+)
- [ ] Zweryfikuj dostępne rozszerzenia (extensions)
- [ ] Sprawdź ustawienia Storage (jeśli używane)
- [ ] Sprawdź ustawienia Authentication (jeśli używane)

---

## 📦 Krok 2: Migracja Struktury Bazy Danych

### 2.1. Lista Migracji do Wykonania

**⚠️ WAŻNE**: Migracje muszą być wykonane w dokładnie tej kolejności!

1. **20250110_create_base_tables.sql** - ⚠️ **PIERWSZA** - Tworzy wszystkie podstawowe tabele (profiles, slabs, categories, cards, grading_companies, transactions, reviews, notifications, watchlists, price_history, checkout_events)
2. **20251113_create_sets_table.sql** - Tworzy tabelę `sets` z danymi początkowymi
3. **20250114_add_rls_policies.sql** - Dodaje Row Level Security policies do istniejących tabel
4. **20250114_add_slab_edition_fields.sql** - Dodaje pola edition do tabeli `slabs`
5. **20250115_add_role_to_profiles.sql** - Dodaje pole `role` do tabeli `profiles`
6. **20250115_create_disputes_table.sql** - Tworzy tabelę `disputes`
7. **20250116_create_cart_sessions_table.sql** - Tworzy tabelę `cart_sessions`
8. **20250116_create_messages_table.sql** - Tworzy tabelę `messages`
9. **20250117_add_performance_indexes.sql** - Dodaje indeksy wydajnościowe
10. **20250118_add_preferred_currency_to_profiles.sql** - Dodaje pole `preferred_currency` do `profiles`
11. **20250118_create_wishlists_tables.sql** - Tworzy tabele związane z wishlistami (wishlists, wishlist_items)
12. **20250119_create_marketplace_cards_view.sql** - ⚠️ **WAŻNE** - Tworzy widok `marketplace_cards` (wymagany dla aplikacji)

### 2.2. Metody Wykonania Migracji

#### Metoda A: Supabase Dashboard (Rekomendowana dla pierwszej migracji)
1. Otwórz SQL Editor w Supabase Dashboard
2. Skopiuj zawartość każdego pliku migracji
3. Wykonaj migracje po kolei, sprawdzając każdą przed przejściem do następnej

#### Metoda B: Supabase CLI
```bash
# Połącz się z nowym projektem
supabase link --project-ref icuumgfjnjynbyqvzxwb

# Wdróż wszystkie migracje
supabase db push
```

#### Metoda C: Skrypt PowerShell (dla pojedynczej migracji)
```powershell
# Użyj istniejącego skryptu, ale zaktualizuj URL i klucze
$env:NEXT_PUBLIC_SUPABASE_URL = "https://icuumgfjnjynbyqvzxwb.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 2.3. Weryfikacja Migracji
- [ ] Sprawdź, czy wszystkie tabele zostały utworzone
- [ ] Zweryfikuj, czy RLS policies są aktywne
- [ ] Sprawdź, czy indeksy zostały utworzone
- [ ] Zweryfikuj, czy dane seed (sets) zostały zaimportowane

---

## 💾 Krok 3: Migracja Danych (Jeśli Wymagana)

### 3.1. Backup Danych z Starej Bazy
Jeśli masz dane produkcyjne do przeniesienia:

```sql
-- Przykład eksportu danych (wykonaj dla każdej tabeli z danymi)
COPY (SELECT * FROM public.cards) TO '/tmp/cards_backup.csv' WITH CSV HEADER;
COPY (SELECT * FROM public.slabs) TO '/tmp/slabs_backup.csv' WITH CSV HEADER;
-- ... itd dla innych tabel
```

### 3.2. Import Danych do Nowej Bazy
```sql
-- Przykład importu danych
COPY public.cards FROM '/tmp/cards_backup.csv' WITH CSV HEADER;
COPY public.slabs FROM '/tmp/slabs_backup.csv' WITH CSV HEADER;
-- ... itd dla innych tabel
```

### 3.3. Tabele do Rozważenia Migracji
- `cards` - jeśli masz zaimportowane karty
- `slabs` - jeśli masz dane o slabach
- `profiles` - jeśli masz użytkowników
- `wishlists` - jeśli masz listy życzeń
- `cart_sessions` - jeśli masz aktywne sesje koszyka
- `price_history` - jeśli masz historię cen
- Storage buckets - jeśli masz pliki w Storage

**Uwaga**: Jeśli to nowa instalacja, możesz pominąć ten krok i zaimportować dane później przez skrypty.

---

## 🔧 Krok 4: Aktualizacja Konfiguracji Kodu

### 4.1. Plik: `src/integrations/supabase/client.ts`

Zaktualizuj:
```typescript
const SUPABASE_URL = "https://icuumgfjnjynbyqvzxwb.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljdXVtZ2Zqbmp5bmJ5cXZ6eHdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMDUyMDIsImV4cCI6MjA3ODc4MTIwMn0.AYre-WMHdgxY6HIlCGiaORMELrAsDnZlHXg_xo3EGu4";
```

### 4.2. Plik: `supabase/config.toml`

Zaktualizuj:
```toml
[project]
id = "icuumgfjnjynbyqvzxwb"
```

### 4.3. Zmienne Środowiskowe

Utwórz/zaktualizuj plik `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://icuumgfjnjynbyqvzxwb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljdXVtZ2Zqbmp5bmJ5cXZ6eHdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMDUyMDIsImV4cCI6MjA3ODc4MTIwMn0.AYre-WMHdgxY6HIlCGiaORMELrAsDnZlHXg_xo3EGu4
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljdXVtZ2Zqbmp5bmJ5cXZ6eHdiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzIwNTIwMiwiZXhwIjoyMDc4NzgxMjAyfQ.iBFD9FnrTwimo9nLEOktzMkY74Y5fSQpoPPl12I-3-w
```

### 4.4. Skrypty Importu

Zaktualizuj skrypty, które używają hardcoded URL:
- `scripts/run-migration-api.mjs` - linia 15
- `scripts/run-migration-direct.ps1` - linia 10
- `scripts/show-migration-sql.ps1` - linia 24
- `scripts/run-migration.ps1` - linia 42
- `scripts/run-migration.js` - linia 23

**Uwaga**: Lepszym rozwiązaniem jest używanie zmiennych środowiskowych zamiast hardcoded wartości.

---

## ⚡ Krok 5: Aktualizacja Edge Functions

### 5.1. Edge Functions do Sprawdzenia

Wszystkie Edge Functions używają zmiennych środowiskowych z Supabase, więc powinny działać automatycznie po aktualizacji konfiguracji projektu. Sprawdź:

- `supabase/functions/process-payment/index.ts`
- `supabase/functions/check-price-alerts/index.ts`
- `supabase/functions/process-auctions/index.ts`
- `supabase/functions/send-notification-email/index.ts`
- `supabase/functions/update-price-history/index.ts`
- `supabase/functions/verify-certificate/index.ts`

### 5.2. Wdrożenie Edge Functions

**📄 Szczegółowa instrukcja**: Zobacz plik `INSTRUKCJA_EDGE_FUNCTIONS.md`

**Metoda A: Supabase Dashboard (Rekomendowana)**
1. Przejdź do: https://supabase.com/dashboard/project/icuumgfjnjynbyqvzxwb/functions
2. Kliknij "Create a new function" dla każdej funkcji
3. Skopiuj kod z `supabase/functions/[nazwa]/index.ts`
4. Wklej i wdróż

**Metoda B: Supabase CLI**
```bash
# Połącz się z nowym projektem
supabase link --project-ref icuumgfjnjynbyqvzxwb

# Wdróż wszystkie Edge Functions
supabase functions deploy
```

**Lista funkcji do wdrożenia:**
- `process-payment` - Przetwarzanie płatności
- `check-price-alerts` - Sprawdzanie alertów cenowych
- `process-auctions` - Przetwarzanie aukcji
- `send-notification-email` - Wysyłanie emaili
- `update-price-history` - Aktualizacja historii cen
- `verify-certificate` - Weryfikacja certyfikatów

### 5.3. Konfiguracja Secrets dla Edge Functions

Jeśli Edge Functions używają zewnętrznych API keys, ustaw je:
```bash
supabase secrets set POKEMON_TCG_API_KEY=your_key_here
supabase secrets set STRIPE_SECRET_KEY=your_key_here
# ... itd dla innych secrets
```

---

## 🧪 Krok 6: Testowanie

### 6.1. Testy Lokalne

1. **Uruchom aplikację lokalnie:**
   ```bash
   npm run dev
   ```

2. **Sprawdź połączenie z bazą:**
   - Zaloguj się do aplikacji
   - Sprawdź, czy dane się ładują
   - Sprawdź, czy zapytania działają

3. **Testy Funkcjonalne:**
   - [ ] Rejestracja użytkownika
   - [ ] Logowanie
   - [ ] Przeglądanie kart
   - [ ] Dodawanie do koszyka
   - [ ] Dodawanie do wishlisty
   - [ ] Tworzenie oferty sprzedaży
   - [ ] Wszystkie inne funkcje aplikacji

### 6.2. Testy Skryptów Importu

```bash
# Test importu sets
npm run import:pokemon:sets

# Test importu kart
npm run import:pokemon
```

### 6.3. Testy Edge Functions

Przetestuj każdą Edge Function osobno, używając Supabase Dashboard lub curl.

---

## 🚀 Krok 7: Aktualizacja Środowisk Deploy

### 7.1. Vercel (Jeśli Używane)

1. Przejdź do Vercel Dashboard → Project Settings → Environment Variables
2. Zaktualizuj:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Redeploy aplikacji

### 7.2. GitHub Actions (Jeśli Używane)

Zaktualizuj secrets w GitHub:
- Settings → Secrets and variables → Actions
- Zaktualizuj:
  - `SUPABASE_PROJECT_REF` → `icuumgfjnjynbyqvzxwb`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

### 7.3. Inne Środowiska

Zaktualizuj zmienne środowiskowe we wszystkich środowiskach (staging, production, itp.)

---

## 📊 Krok 8: Migracja Storage (Jeśli Używane)

### 8.1. Lista Bucketów

Sprawdź, jakie buckety masz w starej bazie:
- `avatars` - awatary użytkowników
- `certificates` - certyfikaty slabów
- `card-images` - obrazy kart
- Inne buckety

### 8.2. Migracja Plików

1. **Eksport z starej bazy:**
   - Użyj Supabase Dashboard lub API do pobrania listy plików
   - Pobierz wszystkie pliki

2. **Import do nowej bazy:**
   - Utwórz te same buckety w nowej bazie
   - Załaduj pliki do nowych bucketów
   - Zaktualizuj referencje w bazie danych (jeśli potrzebne)

---

## ✅ Krok 9: Checklist Końcowy

### 9.1. Weryfikacja Struktury
- [ ] Wszystkie migracje wykonane
- [ ] Wszystkie tabele utworzone
- [ ] Wszystkie RLS policies aktywne
- [ ] Wszystkie indeksy utworzone
- [ ] Funkcje i trigger'y działają

### 9.2. Weryfikacja Danych
- [ ] Dane zaimportowane (jeśli wymagane)
- [ ] Storage zmigrowany (jeśli używany)
- [ ] Użytkownicy zmigrowani (jeśli wymagane)

### 9.3. Weryfikacja Kodu
- [ ] `client.ts` zaktualizowany ✅
- [ ] `config.toml` zaktualizowany ✅
- [ ] `.env` zaktualizowany ✅
- [ ] Skrypty zaktualizowane
- [ ] Edge Functions wdrożone ⏳
- [ ] Widok `marketplace_cards` utworzony ⏳

### 9.4. Weryfikacja Deploy
- [ ] Vercel zaktualizowany
- [ ] GitHub Actions zaktualizowane
- [ ] Wszystkie środowiska zaktualizowane

### 9.5. Testy Końcowe
- [ ] Aplikacja działa lokalnie
- [ ] Aplikacja działa na produkcji
- [ ] Wszystkie funkcje działają
- [ ] Skrypty importu działają
- [ ] Edge Functions działają

---

## 🔄 Krok 10: Post-Migracja

### 10.1. Monitoring

Przez pierwsze dni po migracji monitoruj:
- Logi aplikacji
- Logi Supabase
- Błędy w Sentry (jeśli używane)
- Metryki wydajności

### 10.2. Backup

Upewnij się, że:
- Automatyczne backupy są włączone w nowej bazie
- Masz plan przywracania danych
- Wiesz, jak przywrócić bazę w razie problemów

### 10.3. Dokumentacja

Zaktualizuj dokumentację projektu:
- README.md
- Dokumentację dla zespołu
- Notatki o zmianach

---

## ⚠️ Uwagi i Ostrzeżenia

1. **Service Role Key jest bardzo wrażliwy** - nigdy nie commituj go do repozytorium
2. **Zrób backup starej bazy** przed rozpoczęciem migracji
3. **Testuj na środowisku deweloperskim** przed wdrożeniem na produkcję
4. **Sprawdź limity nowego projektu** (storage, bandwidth, itp.)
5. **Zaktualizuj wszystkie referencje** - nie tylko w kodzie, ale też w dokumentacji, skryptach, itp.

---

## 🆘 Rozwiązywanie Problemów

### Problem: "relation does not exist" (np. `profiles`, `slabs`)

**Błąd**: `ERROR: 42P01: relation "public.slabs" does not exist`

**Przyczyna**: Próbujesz wykonać migrację, która modyfikuje tabelę, która jeszcze nie istnieje. Brakuje początkowej migracji tworzącej podstawowe tabele.

**Rozwiązanie**:
1. **Upewnij się, że wykonałeś migrację `20250110_create_base_tables.sql` jako PIERWSZĄ**
2. Sprawdź w Supabase Dashboard → Database → Tables, czy tabele `profiles` i `slabs` istnieją
3. Jeśli nie istnieją, wykonaj migrację `20250110_create_base_tables.sql` najpierw
4. Następnie wykonaj pozostałe migracje w kolejności chronologicznej

**Weryfikacja**:
```sql
-- Sprawdź, czy tabele istnieją
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'slabs', 'categories', 'cards');
```

### Problem: Migracje nie działają
- Sprawdź, czy masz odpowiednie uprawnienia
- Sprawdź logi w Supabase Dashboard
- Upewnij się, że wykonujesz migracje w odpowiedniej kolejności
- **Upewnij się, że wykonałeś `20250110_create_base_tables.sql` jako pierwszą**

### Problem: Aplikacja nie łączy się z bazą
- Sprawdź, czy URL i klucze są poprawne
- Sprawdź, czy zmienne środowiskowe są ustawione
- Sprawdź, czy RLS policies pozwalają na dostęp

### Problem: Edge Functions nie działają
- Sprawdź, czy funkcje są wdrożone
- Sprawdź, czy secrets są ustawione
- Sprawdź logi Edge Functions w Supabase Dashboard

---

## 📞 Wsparcie

W razie problemów:
1. Sprawdź dokumentację Supabase
2. Sprawdź logi w Supabase Dashboard
3. Skontaktuj się z supportem Supabase (jeśli potrzebne)

---

**Data utworzenia planu**: 2025-01-18  
**Ostatnia aktualizacja**: 2025-01-18

