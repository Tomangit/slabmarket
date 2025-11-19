# Instrukcja: Konfiguracja Cron Job dla Update Price History

## ✅ Co już mamy:

1. ✅ Edge Function `update-price-history` stworzona w lokalnym repozytorium
2. ✅ Funkcja aktualizuje historię cen dla wszystkich aktywnych slabs
3. ✅ Funkcja obsługuje autoryzację przez `x-cron-secret` header

---

## 📋 Następne kroki:

### **Krok 1: Upewnij się, że Edge Function jest wdrożona** 🚀

Jeśli jeszcze nie wdrożyłeś Edge Function `update-price-history` do Supabase:

1. Przejdź do **Supabase Dashboard** → **Edge Functions**
2. Kliknij **Create a new function**
3. Nazwa: `update-price-history`
4. Skopiuj zawartość z `supabase/functions/update-price-history/index.ts`
5. Kliknij **Deploy**

---

### **Krok 2: Sprawdź Secrets** 🔐

Upewnij się, że masz ustawione secrets w Edge Functions:

1. Przejdź do **Edge Functions** → **Settings** (⚙️)
2. Kliknij **Secrets**
3. Sprawdź czy masz:
   - `SUPABASE_URL` - Automatycznie ustawiane przez Supabase
   - `SUPABASE_ANON_KEY` - Automatycznie ustawiane przez Supabase (lub użyj SERVICE_ROLE_KEY)
   - `CRON_SECRET` - Sekretny klucz do autoryzacji cron jobów

**Jeśli nie masz `CRON_SECRET`:**
- Wygeneruj bezpieczny klucz (np. użyj `node scripts/generate-cron-secret.js`)
- Dodaj go jako Secret w Edge Functions
- **Zapisz ten klucz** - będziesz go potrzebował w kroku 3

---

### **Krok 3: Konfiguracja Cron Job** ⏰

#### Metoda A: Użyj migracji SQL (Rekomendowana)

1. **Otwórz plik migracji:**
   - `supabase/migrations/20250121_setup_price_history_cron.sql`

2. **Zaktualizuj URL i CRON_SECRET:**
   - Znajdź linię z `url := 'https://...'`
   - Zastąp `YOUR_PROJECT_URL` swoim URL Supabase (np. `https://icuumgfjnjynbyqvzxwb.supabase.co`)
   - Zastąp `YOUR_CRON_SECRET` swoim sekretem z Edge Functions

3. **Uruchom migrację w Supabase SQL Editor:**
   - Przejdź do **SQL Editor** w Supabase Dashboard
   - Skopiuj zawartość pliku migracji
   - **Zaktualizuj URL i CRON_SECRET** (patrz punkt 2)
   - Kliknij **Run**

#### Metoda B: Ręczne utworzenie przez SQL Editor

W **Supabase SQL Editor** uruchom:

```sql
-- Upewnij się, że rozszerzenia są włączone
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Usuń istniejący cron job (jeśli istnieje)
SELECT cron.unschedule('update-price-history') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'update-price-history'
);

-- Utwórz cron job - ZASTĄP URL I CRON_SECRET!
SELECT cron.schedule(
  'update-price-history',              -- Nazwa joba
  '0 0 * * *',                         -- Harmonogram: Codziennie o północy UTC
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT_URL.supabase.co/functions/v1/update-price-history',
      headers := '{"Content-Type": "application/json", "x-cron-secret": "YOUR_CRON_SECRET"}'::jsonb
    ) AS request_id;
  $$
);
```

**Zastąp:**
- `YOUR_PROJECT_URL` - Twój URL Supabase (np. `icuumgfjnjynbyqvzxwb`)
- `YOUR_CRON_SECRET` - Twój sekret z Edge Functions

**Uwagi:**
- Jeśli widzisz błąd **"schema net does not exist"**, najpierw uruchom `CREATE EXTENSION IF NOT EXISTS pg_net;`
- Jeśli widzisz błąd **"schema cron does not exist"**, najpierw uruchom `CREATE EXTENSION IF NOT EXISTS pg_cron;`

---

### **Krok 4: Wybór harmonogramu** 📅

**Domyślny harmonogram:** Codziennie o północy UTC (`0 0 * * *`)

**Inne opcje:**

- `0 */6 * * *` - Co 6 godzin (00:00, 06:00, 12:00, 18:00 UTC)
- `0 0,12 * * *` - Dwa razy dziennie (północ i południe UTC)
- `0 2 * * *` - Codziennie o 2:00 UTC (poza godzinami szczytu)
- `0 0 * * 0` - Tylko w niedzielę o północy UTC

**Format cron:** `minute hour day month weekday`

---

### **Krok 5: Testowanie** 🧪

#### Test ręczny przez curl:

```bash
curl -X POST https://YOUR_PROJECT_URL.supabase.co/functions/v1/update-price-history \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "x-cron-secret: YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

**Oczekiwana odpowiedź:**
```json
{
  "message": "Price history updated successfully",
  "processed": 150,
  "skipped": 5,
  "total": 155
}
```

#### Weryfikacja cron joba:

W **Supabase SQL Editor** uruchom:

```sql
-- Sprawdź, czy cron job istnieje
SELECT * FROM cron.job WHERE jobname = 'update-price-history';

-- Sprawdź historię wykonania (jeśli dostępne)
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'update-price-history')
ORDER BY start_time DESC
LIMIT 10;
```

---

## 🔍 Weryfikacja działania

Po skonfigurowaniu cron joba:

1. **Poczekaj do następnego uruchomienia** (lub użyj SQL aby uruchomić ręcznie)
2. **Sprawdź logi Edge Function** w Supabase Dashboard:
   - Edge Functions → `update-price-history` → Logs
3. **Sprawdź tabelę `price_history`** w SQL Editor:
   ```sql
   SELECT COUNT(*) as total_entries, 
          MIN(recorded_at) as oldest_entry,
          MAX(recorded_at) as newest_entry
   FROM price_history;
   ```

---

## 🐛 Rozwiązywanie problemów

### Problem: Cron job nie uruchamia się

**Sprawdź:**
1. Czy rozszerzenia `pg_net` i `pg_cron` są włączone
2. Czy URL w cron job jest poprawny
3. Czy `CRON_SECRET` jest poprawny
4. Czy Edge Function jest wdrożona

### Problem: Błąd 401 Unauthorized

**Sprawdź:**
- Czy `x-cron-secret` header w SQL jest zgodny z `CRON_SECRET` w Edge Functions
- Czy używasz prawidłowego formatu JSON w headers

### Problem: Edge Function nie znajduje slabs

**Sprawdź:**
- Czy masz aktywne slabs w tabeli `slabs` z `status = 'active'`
- Czy RLS policies pozwalają na odczyt slabs

---

## 📝 Dodatkowe informacje

**Co robi cron job:**
1. Codziennie o północy UTC wywołuje Edge Function `update-price-history`
2. Edge Function pobiera wszystkie aktywne slabs
3. Dla każdego slab tworzy lub aktualizuje wpis w `price_history` na dzisiejszą datę
4. Jeśli wpis już istnieje, aktualizuje cenę (jeśli się zmieniła)

**Dlaczego to ważne:**
- Pozwala śledzić zmiany cen w czasie
- Umożliwia tworzenie wykresów historii cen
- Jest podstawą do kalkulacji indeksów rynkowych (PSA 10 Index, Grade Index)

---

## ✅ Zakończenie

Po wykonaniu wszystkich kroków:

1. ✅ Cron job jest skonfigurowany
2. ✅ Historia cen będzie aktualizowana automatycznie
3. ✅ Możesz monitorować działanie przez logi Edge Functions

**Gratulacje! 🎉**

