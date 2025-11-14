# Sentry Configuration

Ten projekt używa [Sentry](https://sentry.io/) do monitoringu błędów i wydajności w czasie rzeczywistym.

## Konfiguracja

### 1. Utwórz konto w Sentry

1. Przejdź do [https://sentry.io/signup/](https://sentry.io/signup/)
2. Utwórz nowy projekt typu "Next.js"
3. Skopiuj DSN (Data Source Name) z konfiguracji projektu

### 2. Konfiguracja zmiennych środowiskowych

Dodaj następujące zmienne środowiskowe do pliku `.env.local`:

```env
# Sentry DSN (wymagane)
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/your-project-id

# Sentry Release (opcjonalne, ale zalecane)
NEXT_PUBLIC_SENTRY_RELEASE=slab-market@1.0.0

# Sentry Org i Project (dla uploadu source maps)
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=your-project-slug

# Sentry Auth Token (dla uploadu source maps w CI/CD)
SENTRY_AUTH_TOKEN=your-auth-token
```

### 3. Konfiguracja dla różnych środowisk

#### Development
W trybie development, Sentry będzie:
- Logować wszystkie zdarzenia do konsoli
- Używać `tracesSampleRate: 1.0` (100% transakcji)
- Wyłączać upload source maps

#### Production
W trybie production, Sentry będzie:
- Wysyłać zdarzenia do Sentry.io
- Używać `tracesSampleRate: 0.1` (10% transakcji)
- Uploadować source maps podczas builda

### 4. Upload Source Maps

Source maps są automatycznie uploadowane podczas builda w środowisku production. Upewnij się, że masz ustawione:
- `SENTRY_ORG` - slug Twojej organizacji
- `SENTRY_PROJECT` - slug projektu
- `SENTRY_AUTH_TOKEN` - token autoryzacyjny (można utworzyć w Settings > Auth Tokens)

### 5. Konfiguracja Release

Release można ustawić na kilka sposobów:

#### Opcja 1: Zmienna środowiskowa
```env
NEXT_PUBLIC_SENTRY_RELEASE=slab-market@1.0.0
```

#### Opcja 2: Git commit SHA (zalecane)
```bash
# W package.json
"scripts": {
  "build": "NEXT_PUBLIC_SENTRY_RELEASE=$(git rev-parse HEAD) next build"
}
```

#### Opcja 3: Vercel (automatyczne)
Vercel automatycznie ustawia `VERCEL_GIT_COMMIT_SHA`, który można użyć:
```env
NEXT_PUBLIC_SENTRY_RELEASE=$VERCEL_GIT_COMMIT_SHA
```

## Użycie

### Podstawowe użycie

Sentry automatycznie przechwytuje nieobsłużone błędy. Możesz również ręcznie przechwytywać błędy:

```typescript
import { captureException } from '@/lib/sentry';

try {
  // Twój kod
} catch (error) {
  captureException(error, {
    userId: user?.id,
    action: 'checkout',
  });
}
```

### Przechwytywanie wiadomości

```typescript
import { captureMessage } from '@/lib/sentry';

captureMessage('User completed checkout', 'info', {
  userId: user?.id,
  orderId: order.id,
});
```

### Ustawianie kontekstu użytkownika

```typescript
import { setUser } from '@/lib/sentry';

// Po zalogowaniu
setUser({
  id: user.id,
  email: user.email,
  username: user.username,
});

// Po wylogowaniu
clearUser();
```

### Dodawanie breadcrumbs

```typescript
import { addBreadcrumb } from '@/lib/sentry';

addBreadcrumb({
  category: 'auth',
  message: 'User logged in',
  level: 'info',
  data: {
    userId: user.id,
  },
});
```

### Monitorowanie wydajności

```typescript
import { startTransaction, finishTransaction } from '@/lib/sentry';

const transaction = startTransaction({
  name: 'Checkout Process',
  op: 'navigation',
});

// Twój kod

finishTransaction(transaction);
```

## Integracja z Edge Functions

Aby monitorować błędy w Supabase Edge Functions, dodaj Sentry do funkcji:

```typescript
// supabase/functions/your-function/index.ts
import * as Sentry from "@sentry/deno";

Sentry.init({
  dsn: Deno.env.get("SENTRY_DSN"),
  environment: Deno.env.get("ENVIRONMENT") || "production",
});

// W kodzie funkcji
try {
  // Twój kod
} catch (error) {
  Sentry.captureException(error);
  throw error;
}
```

## Alerty

### Konfiguracja alertów w Sentry

1. Przejdź do Settings > Alerts
2. Utwórz nowy alert
3. Wybierz warunki (np. "When an issue is seen more than 10 times in 1 hour")
4. Dodaj akcje (e-mail, Slack, Discord, etc.)

### Przykładowe alerty

- **Krytyczne błędy**: Błędy występujące więcej niż 5 razy w ciągu 15 minut
- **Nowe błędy**: Każdy nowy typ błędu
- **Wydajność**: Transakcje trwające dłużej niż 3 sekundy
- **Rate limiting**: Zbyt wiele żądań w krótkim czasie

## Best Practices

1. **Nie loguj wrażliwych danych**: Upewnij się, że nie logujesz haseł, tokenów, czy danych karty kredytowej
2. **Używaj kontekstu**: Dodawaj kontekst do błędów (userId, action, etc.)
3. **Filtruj błędy**: Nie loguj błędów z localhost w production
4. **Używaj release**: Taguj release'y, aby łatwiej śledzić błędy
5. **Monitoruj wydajność**: Używaj transakcji do monitorowania wydajności kluczowych operacji

## Rozwiązywanie problemów

### Błędy nie są wysyłane do Sentry

1. Sprawdź, czy `NEXT_PUBLIC_SENTRY_DSN` jest ustawione
2. Sprawdź, czy nie ma błędów w konsoli przeglądarki
3. Sprawdź, czy nie jesteś w trybie development (błędy są tylko logowane)

### Source maps nie działają

1. Sprawdź, czy `SENTRY_ORG` i `SENTRY_PROJECT` są ustawione
2. Sprawdź, czy `SENTRY_AUTH_TOKEN` jest ustawione i ma odpowiednie uprawnienia
3. Sprawdź, czy build jest uruchamiany w trybie production

### Zbyt wiele zdarzeń

1. Zmniejsz `tracesSampleRate` w konfiguracji
2. Dodaj filtry w `beforeSend` do filtrowania niepotrzebnych zdarzeń
3. Skonfiguruj rate limiting w Sentry

## Więcej informacji

- [Sentry Next.js Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry React Documentation](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Sentry Performance Monitoring](https://docs.sentry.io/product/performance/)

