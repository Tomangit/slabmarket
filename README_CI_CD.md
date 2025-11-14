# CI/CD Pipeline

Ten projekt używa GitHub Actions do automatycznego testowania, budowania i deployowania aplikacji.

## Workflow

### 1. Testy (`test.yml`)

Uruchamia się przy każdym push i pull request do `main` lub `develop`:

- **Unit tests**: Testy jednostkowe z pokryciem kodem
- **E2E tests**: Testy end-to-end z Playwright
- **Linter**: Sprawdzanie jakości kodu

### 2. Deploy Production (`deploy.yml`)

Uruchamia się przy push do `main`:

1. **Test**: Uruchamia testy i build
2. **Deploy**: Deployuje na Vercel (production)
3. **Source Maps**: Uploaduje source maps do Sentry

### 3. Deploy Preview (`deploy-preview.yml`)

Uruchamia się przy pull request do `main` lub `develop`:

1. **Test**: Uruchamia testy i build
2. **Deploy Preview**: Tworzy preview deployment na Vercel
3. **Comment**: Dodaje komentarz z linkiem do preview w PR

### 4. Deploy Supabase (`supabase-deploy.yml`)

Uruchamia się przy zmianach w migracjach lub Edge Functions:

1. **Deploy Migrations**: Wdraża migracje bazy danych
2. **Deploy Edge Functions**: Wdraża Edge Functions

## Konfiguracja

### GitHub Secrets

Musisz skonfigurować następujące secrets w GitHub:

#### Vercel

1. **VERCEL_TOKEN**: Token Vercel CLI
   - Utwórz w [Vercel Settings > Tokens](https://vercel.com/account/tokens)
   - Scope: `Full Account`

#### Supabase

2. **SUPABASE_PROJECT_REF**: Project reference ID
   - Znajdziesz w Supabase Dashboard > Settings > General
   - Format: `xxsnsomathouvuhtshyw`

3. **SUPABASE_ACCESS_TOKEN**: Access token
   - Utwórz w [Supabase Dashboard > Access Tokens](https://supabase.com/dashboard/account/tokens)
   - Scope: `project:read`, `project:write`

#### Aplikacja

4. **NEXT_PUBLIC_SUPABASE_URL**: URL Supabase
5. **NEXT_PUBLIC_SUPABASE_ANON_KEY**: Anon key Supabase
6. **SUPABASE_SERVICE_ROLE_KEY**: Service role key Supabase

#### Sentry

7. **NEXT_PUBLIC_SENTRY_DSN**: Sentry DSN
8. **SENTRY_ORG**: Sentry organization slug
9. **SENTRY_PROJECT**: Sentry project slug
10. **SENTRY_AUTH_TOKEN**: Sentry auth token

### Konfiguracja Vercel

1. Połącz repozytorium z Vercel:
   - Przejdź do [Vercel Dashboard](https://vercel.com/dashboard)
   - Kliknij "Add New Project"
   - Wybierz repozytorium
   - Skonfiguruj ustawienia projektu

2. Ustaw zmienne środowiskowe w Vercel:
   - Przejdź do Settings > Environment Variables
   - Dodaj wszystkie wymagane zmienne
   - Ustaw dla Production, Preview i Development

3. Wyłącz automatyczne deployowanie w Vercel:
   - Przejdź do Settings > Git
   - Wyłącz "Automatic deployments from Git"
   - Teraz deployowanie będzie odbywać się przez GitHub Actions

### Konfiguracja Supabase

1. Utwórz Access Token:
   - Przejdź do [Supabase Dashboard > Access Tokens](https://supabase.com/dashboard/account/tokens)
   - Kliknij "Generate new token"
   - Skopiuj token i dodaj do GitHub Secrets

2. Skonfiguruj project reference:
   - Znajdź Project Reference w Settings > General
   - Dodaj do GitHub Secrets jako `SUPABASE_PROJECT_REF`

## Użycie

### Deploy Production

1. Wykonaj zmiany w kodzie
2. Commit i push do `main`:
   ```bash
   git add .
   git commit -m "feat: add new feature"
   git push origin main
   ```
3. GitHub Actions automatycznie:
   - Uruchomi testy
   - Zbuduje aplikację
   - Wdroży na Vercel (production)

### Deploy Preview

1. Utwórz pull request do `main`:
   ```bash
   git checkout -b feature/new-feature
   git add .
   git commit -m "feat: add new feature"
   git push origin feature/new-feature
   ```
2. Otwórz pull request na GitHub
3. GitHub Actions automatycznie:
   - Uruchomi testy
   - Zbuduje aplikację
   - Wdroży preview na Vercel
   - Doda komentarz z linkiem do preview

### Deploy Supabase

1. Dodaj migrację lub Edge Function:
   ```bash
   # Dodaj migrację
   echo "CREATE TABLE..." > supabase/migrations/20250120_new_table.sql
   
   # Lub dodaj Edge Function
   echo "Deno.serve..." > supabase/functions/new-function/index.ts
   ```
2. Commit i push do `main`:
   ```bash
   git add supabase/
   git commit -m "feat: add new migration"
   git push origin main
   ```
3. GitHub Actions automatycznie:
   - Wdroży migracje
   - Wdroży Edge Functions

### Skip Deploy

Aby pominąć deploy Supabase, dodaj `[skip migrations]` do commita:

```bash
git commit -m "docs: update README [skip migrations]"
```

## Troubleshooting

### Deploy fails

1. Sprawdź logi w GitHub Actions
2. Sprawdź, czy wszystkie secrets są skonfigurowane
3. Sprawdź, czy Vercel project jest poprawnie skonfigurowany

### Supabase deploy fails

1. Sprawdź, czy `SUPABASE_ACCESS_TOKEN` jest poprawny
2. Sprawdź, czy `SUPABASE_PROJECT_REF` jest poprawny
3. Sprawdź logi w GitHub Actions

### Preview deployment not working

1. Sprawdź, czy `VERCEL_TOKEN` jest poprawny
2. Sprawdź, czy Vercel project jest połączony z repozytorium
3. Sprawdź logi w GitHub Actions

## Best Practices

1. **Zawsze testuj lokalnie przed push**: Uruchom `npm run test` i `npm run build`
2. **Używaj preview deployments**: Testuj zmiany w preview przed merge do main
3. **Review PR**: Zawsze przeglądaj kod przed merge
4. **Monitoruj deployments**: Sprawdź logi po każdym deploy
5. **Używaj semantic commits**: Ułatwia to śledzenie zmian

## Więcej informacji

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)

