# Instrukcja: Auto Import Sets - Co dalej?

## ✅ Co już mamy:

1. ✅ Edge Function `auto-import-sets` stworzona w lokalnym repozytorium
2. ✅ Funkcja automatycznie wykrywa nowe sety w Pokemon TCG API
3. ✅ Importuje tylko nowe sety (delta updates)

---

## 📋 Następne kroki:

### **Krok 1: Wdrożenie Edge Function do Supabase** 🚀

#### Metoda A: Supabase Dashboard (Najprostsza)

1. **Zaloguj się do Supabase Dashboard:**
   - Przejdź do: https://supabase.com/dashboard/project/xxsnsomathouvuhtshyw
   - Zaloguj się

2. **Przejdź do Edge Functions:**
   - W menu bocznym kliknij **Edge Functions**
   - Kliknij **Create a new function**

3. **Utwórz funkcję:**
   - **Nazwa funkcji**: `auto-import-sets`
   - **Skopiuj zawartość** z `supabase/functions/auto-import-sets/index.ts`
   - **Wklej kod** do edytora w Dashboard
   - Kliknij **Deploy**

#### Metoda B: Supabase CLI (Dla zaawansowanych)

```bash
# Zaloguj się (jeśli nie jesteś)
supabase login

# Połącz z projektem (jeśli nie jesteś połączony)
supabase link --project-ref xxsnsomathouvuhtshyw

# Wdróż funkcję
supabase functions deploy auto-import-sets
```

---

### **Krok 2: Ustawienie Secrets (Zmienne środowiskowe)** 🔐

Funkcja używa zmiennych środowiskowych:

#### W Supabase Dashboard:

1. Przejdź do **Edge Functions** → **Settings** (⚙️)
2. Kliknij **Secrets**
3. Sprawdź czy masz już ustawione:
   - `SUPABASE_URL` - Automatycznie ustawiane przez Supabase
   - `SUPABASE_SERVICE_ROLE_KEY` - Automatycznie ustawiane przez Supabase

4. **Dodaj opcjonalne** (jeśli używasz):
   - `POKEMON_TCG_API_KEY` - Klucz API Pokemon TCG (dla wyższych limitów)
   - `CRON_SECRET` - Sekretny klucz do autentykacji cron jobów (zalecane)

**Jak znaleźć Service Role Key:**
- Dashboard → Settings → API → **service_role** (secret key)

**Jak utworzyć CRON_SECRET:**

CRON_SECRET to **dowolny, bezpieczny ciąg znaków**, który wygenerujesz samodzielnie. Używa się go do autoryzacji żądań z cron jobów.

**Opcja 1: Wygeneruj przez skrypt (najprostsze):**
```bash
node scripts/generate-cron-secret.js
```

**Opcja 2: Wygeneruj online:**
- Przejdź do: https://randomkeygen.com/
- Wybierz "CodeIgniter Encryption Keys" lub "Symmetric Encryption Key"
- Skopiuj wygenerowany klucz

**Opcja 3: Wymyśl samodzielnie:**
- Dowolny długi ciąg znaków (min. 16 znaków, zalecane 32+)
- Przykład: `my-super-secret-cron-key-2025-xyz123-abc456`
- Może zawierać: litery (A-Z, a-z), cyfry (0-9), myślniki (-), podkreślniki (_)

**Uwaga:** CRON_SECRET NIE jest konieczny - możesz go pominąć. Funkcja będzie działać bez niego, ale dodanie go zwiększa bezpieczeństwo (tylko cron joby z tym sekretem będą mogły uruchamiać funkcję).

---

### **Krok 3: Testowanie funkcji** 🧪

#### Test manualny przez Dashboard:

1. Przejdź do **Edge Functions** → `auto-import-sets`
2. Kliknij przycisk **"Test"** (ikonka samolotu w prawym górnym rogu)
3. W oknie testowym:
   - **Method**: `POST` (powinno być domyślnie)
   - **Query Parameters**: Dodaj `language=english` (opcjonalnie)
   - **Headers**: 
     - Jeśli używasz CRON_SECRET, dodaj:
       ```
       x-cron-secret: Vb7XpXfbubg0aZGVHXLsu8AJ3xafglZ8
       ```
     - **Authorization**: `Bearer YOUR_SERVICE_ROLE_KEY` (ważne!)
   - **Body**: Możesz zostawić puste `{}` lub całkowicie puste
4. Kliknij **"Run"** lub **"Invoke"**
5. Sprawdź odpowiedź - powinno pokazać ile setów zostało zaimportowanych

**Uwaga:** Jeśli nie widzisz pola "Request body", to normalne - możesz zostawić body puste. Ważniejsze są **Headers** (Authorization i opcjonalnie x-cron-secret).

#### Test przez curl:

```bash
curl -X POST https://xxsnsomathouvuhtshyw.supabase.co/functions/v1/auto-import-sets?language=english \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "x-cron-secret: YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

**Oczekiwana odpowiedź:**
```json
{
  "message": "Auto-import completed",
  "imported": 5,
  "skipped": 150,
  "errors": 0,
  "total": 155,
  "newSets": [
    { "id": "sv5", "name": "Temporal Forces" }
  ]
}
```

---

### **Krok 3.5: Włącz rozszerzenia pg_net i pg_cron** 🔧

**WAŻNE:** Przed utworzeniem cron joba musisz włączyć rozszerzenia `pg_net` (do żądań HTTP) i `pg_cron` (do harmonogramowania zadań).

#### W Supabase Dashboard:

1. Przejdź do **SQL Editor** w Supabase Dashboard
2. Uruchom następujące zapytanie:
   ```sql
   -- Włącz pg_net (do żądań HTTP)
   CREATE EXTENSION IF NOT EXISTS pg_net;
   
   -- Włącz pg_cron (do harmonogramowania)
   CREATE EXTENSION IF NOT EXISTS pg_cron;
   ```
3. Kliknij **Run** (lub Ctrl+Enter)
4. Powinno pokazać "Success. No rows returned" dla obu zapytań

**Alternatywnie:** Uruchom migrację SQL:
- Otwórz plik `supabase/migrations/20250120_enable_pg_net.sql`
- Skopiuj zawartość do SQL Editor
- Uruchom zapytanie

---

### **Krok 4: Konfiguracja Cron Job (Automatyczne uruchamianie)** ⏰

Aby funkcja uruchamiała się automatycznie co tydzień, skonfiguruj cron job w Supabase:

#### Metoda A: Przez SQL Editor (Rekomendowana)

**Po włączeniu pg_net**, w **SQL Editor** uruchom:

```sql
-- Run weekly on Monday at 2 AM UTC
SELECT cron.schedule(
  'auto-import-sets',
  '0 2 * * 1', -- Weekly on Monday at 2 AM
  $$
  SELECT
    net.http_post(
      url:='https://xxsnsomathouvuhtshyw.supabase.co/functions/v1/auto-import-sets?language=english',
      headers:='{"Content-Type": "application/json", "x-cron-secret": "YOUR_CRON_SECRET"}'::jsonb
    ) AS request_id;
  $$
);
```

**Zastąp `YOUR_CRON_SECRET`** swoim sekretem (ten, który dodałeś jako Secret w Edge Functions).

**Jeśli nie używasz CRON_SECRET**, możesz uprościć do:

```sql
SELECT cron.schedule(
  'auto-import-sets',
  '0 2 * * 1',
  $$
  SELECT
    net.http_post(
      url:='https://xxsnsomathouvuhtshyw.supabase.co/functions/v1/auto-import-sets?language=english',
      headers:='{"Content-Type": "application/json"}'::jsonb
    ) AS request_id;
  $$
);
```

#### Metoda B: Przez Dashboard (jeśli dostępne)

1. Przejdź do **Database** → **Cron Jobs** (jeśli dostępne w Dashboard)
2. Kliknij **Create a new cron job**
3. Wypełnij:
   - **Name**: `auto-import-sets`
   - **Schedule**: `0 2 * * 1` (każdy poniedziałek o 2:00 UTC)
   - **Command**: Skopiuj SQL z metody A powyżej
4. Kliknij **Save**

**Uwaga:** 
- Jeśli widzisz błąd **"schema net does not exist"**, najpierw uruchom `CREATE EXTENSION IF NOT EXISTS pg_net;` (patrz Krok 3.5).
- Jeśli widzisz błąd **"schema cron does not exist"**, najpierw uruchom `CREATE EXTENSION IF NOT EXISTS pg_cron;` (patrz Krok 3.5).

**Harmonogramy (przykłady):**
- `0 2 * * 1` - Każdy poniedziałek o 2:00 UTC
- `0 0 * * 0` - Każdą niedzielę o północy UTC
- `0 0 1 * *` - Pierwszego dnia miesiąca o północy UTC
- `0 */6 * * *` - Co 6 godzin

**Format cron:** `minute hour day month weekday`

---

### **Krok 5: (Opcjonalnie) Automatyczny import kart dla nowych setów** 🃏

Po zaimportowaniu nowych setów, możesz chcieć automatycznie zaimportować karty dla tych setów.

#### Opcja A: Manualne uruchomienie scriptu

Po uruchomieniu `auto-import-sets` i wykryciu nowych setów:

```bash
# Zaimportuj karty dla konkretnego setu
node scripts/import-pokemon-cards.mjs --set "Temporal Forces"

# Lub zaimportuj wszystkie sety
node scripts/import-pokemon-cards.mjs
```

#### Opcja B: Utworzenie Edge Function `auto-import-cards`

Mogę stworzyć Edge Function, która automatycznie importuje karty dla nowych setów wykrytych przez `auto-import-sets`.

**Chcesz, żebym to zrobił?**

---

## 🔍 Weryfikacja działania

### Sprawdź logi:

1. Przejdź do **Edge Functions** → `auto-import-sets`
2. Kliknij zakładkę **Logs**
3. Sprawdź ostatnie wywołania funkcji

### Sprawdź w bazie danych:

1. Przejdź do **Table Editor** → `sets`
2. Sortuj po `created_at` (descending)
3. Sprawdź czy nowe sety zostały dodane

### Test endpointu:

Możesz użyć funkcji "Invoke" w Dashboard lub curl:

```bash
curl -X POST https://xxsnsomathouvuhtshyw.supabase.co/functions/v1/auto-import-sets?language=english \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

---

## 📝 Checklist

- [ ] Wdrożono Edge Function `auto-import-sets` do Supabase
- [ ] Ustawiono Secrets (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
- [ ] (Opcjonalnie) Ustawiono POKEMON_TCG_API_KEY
- [ ] (Opcjonalnie) Ustawiono CRON_SECRET
- [ ] Przetestowano funkcję manualnie
- [ ] Skonfigurowano cron job dla automatycznego uruchamiania
- [ ] Sprawdzono logi - funkcja działa poprawnie
- [ ] Sprawdzono bazę danych - nowe sety są importowane

---

## ⚠️ Uwagi

1. **Rate Limiting**: Pokemon TCG API ma limity rate limitingu. Funkcja obsługuje timeouty i retry, ale przy dużych wolumenach może być wolna.

2. **API Key**: Jeśli masz Pokemon TCG API key, dodaj go jako secret `POKEMON_TCG_API_KEY` dla wyższych limitów.

3. **Delta Updates**: Funkcja importuje tylko nowe sety (nie duplikuje istniejących), więc możesz ją uruchamiać bezpiecznie wielokrotnie.

4. **Cron Secret**: Zalecane jest ustawienie `CRON_SECRET` dla bezpieczeństwa, żeby tylko cron jobs mogły uruchamiać funkcję.

5. **Monitoring**: Sprawdzaj logi regularnie, żeby upewnić się, że wszystko działa poprawnie.

---

## 🚀 Co dalej?

Po skonfigurowaniu automatycznego importu setów:

1. **Automatyczny import kart**: Stwórz Edge Function `auto-import-cards`, która automatycznie importuje karty dla nowo wykrytych setów.

2. **Notyfikacje**: Możesz dodać powiadomienia (email/webhook), gdy nowe sety są wykrywane.

3. **Dashboard monitoring**: Stwórz stronę w aplikacji do monitorowania importów.

---

**Data utworzenia**: 2025-01-20  
**Status**: Gotowe do wdrożenia ✅

