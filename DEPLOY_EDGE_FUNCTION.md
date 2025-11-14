# Instrukcja wdrożenia Edge Function

## Opcja 1: Supabase Dashboard (najprostsza)

1. Otwórz https://supabase.com/dashboard
2. Wybierz swój projekt
3. Przejdź do **Edge Functions** w menu bocznym
4. Kliknij **Create a new function**
5. Nazwa funkcji: `verify-certificate`
6. Skopiuj całą zawartość pliku `supabase/functions/verify-certificate/index.ts`
7. Wklej do edytora w Dashboard
8. Kliknij **Deploy**

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

# Połącz z projektem (użyj swojego project ref)
supabase link --project-ref xxsnsomathouvuhtshyw
```

### Wdrożenie funkcji

```bash
# Z katalogu głównego projektu
cd c:\Users\tjedr\SM

# Wdróż funkcję
supabase functions deploy verify-certificate
```

### Testowanie lokalnie (opcjonalnie)

```bash
# Uruchom lokalny Supabase (wymaga Docker)
supabase start

# Uruchom funkcję lokalnie
supabase functions serve verify-certificate

# Testuj przez curl lub Postman
curl -X POST http://localhost:54321/functions/v1/verify-certificate \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "grading_company": "PSA",
    "certificate_number": "82749361",
    "grade": "10"
  }'
```

## Weryfikacja wdrożenia

Po wdrożeniu funkcja będzie dostępna pod adresem:
```
https://xxsnsomathouvuhtshyw.supabase.co/functions/v1/verify-certificate
```

Możesz przetestować w formularzu sprzedaży (`/sell`) - przycisk "Verify & Continue" powinien działać.

## Uwagi

- Funkcja wymaga autentykacji (Bearer token)
- W środowisku produkcyjnym Supabase automatycznie ustawia zmienne środowiskowe
- Tabela `certificate_verifications` jest opcjonalna - funkcja działa bez niej (loguje błąd, ale kontynuuje)

