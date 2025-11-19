# Instrukcja Wdrożenia Edge Functions

## 📋 Przegląd

Masz 6 Edge Functions do wdrożenia w nowej bazie Supabase:
1. `process-payment` - Przetwarzanie płatności z escrow
2. `check-price-alerts` - Sprawdzanie alertów cenowych
3. `process-auctions` - Przetwarzanie aukcji
4. `send-notification-email` - Wysyłanie emaili powiadomień
5. `update-price-history` - Aktualizacja historii cen
6. `verify-certificate` - Weryfikacja certyfikatów slabów

---

## 🚀 Metoda 1: Supabase Dashboard (Najprostsza)

### Krok 1: Zaloguj się do Supabase Dashboard
1. Przejdź do: https://supabase.com/dashboard/project/icuumgfjnjynbyqvzxwb
2. Zaloguj się do swojego konta

### Krok 2: Przejdź do Edge Functions
1. W menu bocznym kliknij **Edge Functions**
2. Kliknij **Create a new function**

### Krok 3: Wdróż każdą funkcję

Dla każdej funkcji wykonaj:

1. **Kliknij "Create a new function"**
2. **Nazwa funkcji**: Wpisz nazwę (np. `process-payment`)
3. **Skopiuj zawartość pliku** z `supabase/functions/[nazwa-funkcji]/index.ts`
4. **Wklej kod** do edytora
5. **Kliknij "Deploy"**

**Powtórz dla wszystkich 6 funkcji:**
- `process-payment`
- `check-price-alerts`
- `process-auctions`
- `send-notification-email`
- `update-price-history`
- `verify-certificate`

### Krok 4: Ustaw Secrets (Zmienne Środowiskowe)

1. W Edge Functions kliknij **Settings** (⚙️)
2. Kliknij **Secrets**
3. Dodaj następujące secrets:

```
SUPABASE_URL=https://icuumgfjnjynbyqvzxwb.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljdXVtZ2Zqbmp5bmJ5cXZ6eHdiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzIwNTIwMiwiZXhwIjoyMDc4NzgxMjAyfQ.iBFD9FnrTwimo9nLEOktzMkY74Y5fSQpoPPl12I-3-w
```

**Opcjonalne** (jeśli używasz):
```
POKEMON_TCG_API_KEY=599aabcc-8b8a-41a5-ab72-7c0c0a430fde
STRIPE_SECRET_KEY=your_stripe_key_here
```

---

## 🛠️ Metoda 2: Supabase CLI (Dla Zaawansowanych)

### Krok 1: Zainstaluj Supabase CLI

**Windows (PowerShell):**
```powershell
# Użyj Scoop lub Chocolatey
scoop install supabase
# LUB
choco install supabase

# LUB pobierz z: https://github.com/supabase/cli/releases
```

**Alternatywnie (npm):**
```bash
npm install -g supabase
```

### Krok 2: Zaloguj się
```bash
supabase login
```

### Krok 3: Połącz się z projektem
```bash
supabase link --project-ref icuumgfjnjynbyqvzxwb
```

### Krok 4: Ustaw Secrets
```bash
supabase secrets set SUPABASE_URL=https://icuumgfjnjynbyqvzxwb.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljdXVtZ2Zqbmp5bmJ5cXZ6eHdiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzIwNTIwMiwiZXhwIjoyMDc4NzgxMjAyfQ.iBFD9FnrTwimo9nLEOktzMkY74Y5fSQpoPPl12I-3-w
```

### Krok 5: Wdróż wszystkie funkcje
```bash
# Wdróż wszystkie na raz
supabase functions deploy

# LUB wdróż każdą osobno
supabase functions deploy process-payment
supabase functions deploy check-price-alerts
supabase functions deploy process-auctions
supabase functions deploy send-notification-email
supabase functions deploy update-price-history
supabase functions deploy verify-certificate
```

---

## ✅ Weryfikacja

### Sprawdź w Dashboard:
1. Przejdź do **Edge Functions** w Supabase Dashboard
2. Powinieneś zobaczyć wszystkie 6 funkcji jako "Active"

### Przetestuj funkcję:
```bash
# Przykład testu verify-certificate
curl -X POST https://icuumgfjnjynbyqvzxwb.supabase.co/functions/v1/verify-certificate \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{"grading_company": "PSA", "certificate_number": "12345678"}'
```

---

## 📝 Uwagi

1. **Secrets są globalne** - ustawione raz działają dla wszystkich funkcji
2. **Funkcje używają zmiennych środowiskowych** - `SUPABASE_URL` i `SUPABASE_SERVICE_ROLE_KEY` są automatycznie dostępne
3. **CORS jest skonfigurowany** - wszystkie funkcje mają nagłówki CORS
4. **Funkcje są gotowe do użycia** - nie wymagają dodatkowej konfiguracji

---

## 🔗 URL-e Funkcji

Po wdrożeniu, funkcje będą dostępne pod:
- `https://icuumgfjnjynbyqvzxwb.supabase.co/functions/v1/process-payment`
- `https://icuumgfjnjynbyqvzxwb.supabase.co/functions/v1/check-price-alerts`
- `https://icuumgfjnjynbyqvzxwb.supabase.co/functions/v1/process-auctions`
- `https://icuumgfjnjynbyqvzxwb.supabase.co/functions/v1/send-notification-email`
- `https://icuumgfjnjynbyqvzxwb.supabase.co/functions/v1/update-price-history`
- `https://icuumgfjnjynbyqvzxwb.supabase.co/functions/v1/verify-certificate`

---

**Data utworzenia**: 2025-01-19

