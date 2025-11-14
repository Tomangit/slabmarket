# Testy integracyjne Edge Functions

Ten dokument opisuje strukturę testów integracyjnych dla Supabase Edge Functions.

## Struktura testów

```
supabase/functions/
├── _shared/
│   └── test-utils.ts          # Wspólne narzędzia testowe (mocki, helpery)
├── _tests/
│   ├── verify-certificate.test.ts
│   ├── process-payment.test.ts
│   ├── check-price-alerts.test.ts
│   ├── send-notification-email.test.ts
│   ├── update-price-history.test.ts
│   └── process-auctions.test.ts
└── [edge-functions]/
    └── index.ts               # Rzeczywiste Edge Functions
```

## Uruchamianie testów

### Lokalnie

```bash
# Uruchom wszystkie testy Edge Functions
deno test --allow-env --allow-net supabase/functions/_tests/

# Uruchom testy w trybie watch
deno test --allow-env --allow-net --watch supabase/functions/_tests/

# Uruchom konkretny test
deno test --allow-env --allow-net supabase/functions/_tests/verify-certificate.test.ts
```

### W CI/CD

Testy są automatycznie uruchamiane w GitHub Actions przy każdym pushu do `main` lub `develop`, lub przy tworzeniu pull requesta.

## Konfiguracja

### Zmienne środowiskowe

Testy wymagają następujących zmiennych środowiskowych (domyślne wartości są używane w testach):

- `SUPABASE_URL` - URL projektu Supabase
- `SUPABASE_ANON_KEY` - Klucz anonimowy Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Klucz service role Supabase
- `CRON_SECRET` - Sekret dla funkcji cron
- `SITE_URL` - URL strony

### Deno Configuration

Konfiguracja Deno znajduje się w pliku `deno.json`:

```json
{
  "tasks": {
    "test:edge": "deno test --allow-env --allow-net supabase/functions/_tests/",
    "test:edge:watch": "deno test --allow-env --allow-net --watch supabase/functions/_tests/"
  }
}
```

## Struktura testów

### Test Utilities (`_shared/test-utils.ts`)

Zawiera wspólne narzędzia testowe:

- `createMockSupabaseClient()` - Tworzy mock klienta Supabase
- `createMockRequest()` - Tworzy mock Request
- `createMockEnv()` - Tworzy mock zmiennych środowiskowych

### Przykładowy test

```typescript
import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { createMockRequest, createMockEnv } from "../_shared/test-utils.ts";

Deno.test("edge-function: test case", async () => {
  const req = createMockRequest("POST", { /* body */ });
  const env = createMockEnv();
  
  for (const [key, value] of Object.entries(env)) {
    Deno.env.set(key, value);
  }

  const res = await handleEdgeFunction(req);
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.success, true);
});
```

## Testowane funkcje

### 1. verify-certificate

Testy weryfikacji certyfikatów gradingowych:

- CORS preflight
- Brak autoryzacji
- Nieprawidłowy token
- Brak wymaganych pól
- Weryfikacja PSA
- Weryfikacja BGS
- Nieobsługiwana firma gradingowa

### 2. process-payment

Testy przetwarzania płatności:

- CORS preflight
- Brak wymaganych pól
- Transakcja nie znaleziona
- Niezgodność danych transakcji
- Pomyślne przetwarzanie płatności
- Tworzenie konta escrow dla nowego sprzedawcy

### 3. check-price-alerts

Testy alertów cenowych:

- CORS preflight
- Brak elementów watchlist z alertami
- Tworzenie powiadomienia przy wyzwoleniu alertu
- Pomijanie elementów, gdy cena nie została osiągnięta
- Pomijanie, jeśli powiadomienie już istnieje

### 4. send-notification-email

Testy wysyłania e-maili:

- CORS preflight
- Brak wymaganych pól
- Pomyślne kolejkowanie e-maila
- Różne typy powiadomień

### 5. update-price-history

Testy aktualizacji historii cen:

- CORS preflight
- Brak autoryzacji bez cron secret
- Autoryzacja z cron secret
- Brak aktywnych slabs
- Tworzenie wpisów historii cen
- Obsługa brakującej tabeli price_history

### 6. process-auctions

Testy przetwarzania aukcji:

- CORS preflight
- Brak autoryzacji bez cron secret
- Autoryzacja z cron secret
- Brak aukcji do przetworzenia
- Oznaczanie aukcji jako wygasłe, gdy nie ma ofert

## Mockowanie Supabase

Testy używają mocków Supabase zamiast rzeczywistej bazy danych. Mocki są konfigurowane w `test-utils.ts`:

```typescript
const supabase = createMockSupabaseClient({
  transactions_select: {
    data: { /* mock data */ },
    error: null,
  },
  transactions_update: {
    data: null,
    error: null,
  },
});
```

## Best Practices

1. **Izolacja testów** - Każdy test powinien być niezależny od innych
2. **Mockowanie** - Używaj mocków dla wszystkich zewnętrznych zależności
3. **Asercje** - Sprawdzaj zarówno status odpowiedzi, jak i dane
4. **CORS** - Zawsze testuj obsługę CORS preflight
5. **Autoryzacja** - Testuj przypadki z i bez autoryzacji
6. **Błędy** - Testuj zarówno przypadki sukcesu, jak i błędy

## Dodawanie nowych testów

1. Utwórz nowy plik testowy w `supabase/functions/_tests/`
2. Zaimportuj potrzebne narzędzia z `_shared/test-utils.ts`
3. Napisz testy używając `Deno.test()`
4. Uruchom testy lokalnie: `deno test --allow-env --allow-net supabase/functions/_tests/[nazwa].test.ts`
5. Dodaj testy do CI/CD (automatycznie wykrywane)

## Troubleshooting

### Testy nie znajdują modułów

Upewnij się, że używasz prawidłowych ścieżek względnych w importach.

### Błędy autoryzacji

Sprawdź, czy mocki Supabase zwracają poprawne dane użytkownika.

### Błędy CORS

Upewnij się, że testy obsługują zarówno OPTIONS, jak i POST requests.

## Przyszłe ulepszenia

- [ ] Integracja z rzeczywistą bazą danych testową
- [ ] Testy end-to-end dla Edge Functions
- [ ] Testy wydajnościowe
- [ ] Testy bezpieczeństwa
- [ ] Testy integracyjne z zewnętrznymi API (Stripe, itp.)

