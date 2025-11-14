# Testing Guide

Ten projekt używa dwóch typów testów:

## 1. Testy jednostkowe (Jest + React Testing Library)

Testy jednostkowe dla serwisów i komponentów React.

### Uruchamianie testów

```bash
# Wszystkie testy
npm run test

# Testy w trybie watch (automatyczne uruchamianie przy zmianach)
npm run test:watch

# Testy z pokryciem kodem
npm run test:coverage
```

### Struktura testów

Testy jednostkowe znajdują się w:
- `src/services/__tests__/` - testy serwisów
- `src/components/__tests__/` - testy komponentów (do dodania)

### Przykład testu

```typescript
import { shippingService } from '../shippingService';

describe('shippingService', () => {
  it('should calculate shipping cost', () => {
    const result = shippingService.calculateShippingCost(100, {
      insured: true,
      temperatureControlled: false,
    });
    
    expect(result.totalCost).toBeGreaterThan(0);
  });
});
```

## 2. Testy E2E (Playwright)

Testy end-to-end dla kluczowych ścieżek użytkownika.

### Uruchamianie testów E2E

```bash
# Wszystkie testy E2E
npm run test:e2e

# Testy E2E z interfejsem graficznym
npm run test:e2e:ui

# Testy E2E w trybie headed (z widoczną przeglądarką)
npm run test:e2e:headed
```

### Struktura testów E2E

Testy E2E znajdują się w:
- `e2e/` - wszystkie testy end-to-end

### Przykład testu E2E

```typescript
import { test, expect } from '@playwright/test';

test('should load homepage', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('text=Slab Market')).toBeVisible();
});
```

## CI/CD

Testy są automatycznie uruchamiane w GitHub Actions przy:
- Push do `main` lub `develop`
- Pull Request do `main` lub `develop`

Workflow znajduje się w `.github/workflows/test.yml`.

## Pokrycie kodem

Aktualne pokrycie kodem można sprawdzić uruchamiając:

```bash
npm run test:coverage
```

Raport HTML będzie dostępny w `coverage/lcov-report/index.html`.

## Dodawanie nowych testów

### Test jednostkowy

1. Utwórz plik `*.test.ts` lub `*.test.tsx` obok testowanego pliku lub w `__tests__/`
2. Zaimportuj funkcje/komponenty do przetestowania
3. Napisz testy używając `describe` i `it`

### Test E2E

1. Utwórz plik `*.spec.ts` w katalogu `e2e/`
2. Użyj `test.describe` do grupowania testów
3. Użyj `test()` do definiowania pojedynczych testów

## Najlepsze praktyki

1. **Testy jednostkowe**:
   - Testuj logikę biznesową, nie implementację
   - Używaj mocków dla zewnętrznych zależności (Supabase, API)
   - Testuj edge cases i błędy

2. **Testy E2E**:
   - Testuj kluczowe ścieżki użytkownika
   - Używaj `data-testid` dla stabilnych selektorów
   - Unikaj testów zależnych od czasu (używaj `waitFor`)

3. **Organizacja**:
   - Grupuj powiązane testy w `describe` bloki
   - Używaj opisowych nazw testów
   - Utrzymuj testy niezależne od siebie

