# Checklist Przed Importem Kart

## ✅ Co już zostało zrobione:

- [x] Wszystkie migracje wykonane (12 migracji)
- [x] Widok `marketplace_cards` utworzony ✅
- [x] Edge Functions wdrożone (6 funkcji) ✅
- [x] Konfiguracja zaktualizowana (`client.ts`, `config.toml`, `.env`) ✅
- [x] Sets zaimportowane (455 sets) ✅

## ⚠️ Co jeszcze warto sprawdzić przed importem:

### 1. Kategorie (Categories)
Tabela `categories` jest pusta. Jeśli aplikacja używa kategorii, warto je dodać:

```sql
-- Przykładowe kategorie dla Pokemon TCG
INSERT INTO public.categories (id, name, slug, description, enabled) VALUES
  ('pokemon-tcg', 'Pokemon TCG', 'pokemon-tcg', 'Pokemon Trading Card Game', true)
ON CONFLICT (id) DO NOTHING;
```

**Sprawdź**: Czy aplikacja wymaga kategorii? Jeśli nie, możesz pominąć.

### 2. Firmy Certyfikujące (Grading Companies)
Tabela `grading_companies` jest pusta. Warto dodać podstawowe firmy:

```sql
-- Dodaj podstawowe firmy certyfikujące
INSERT INTO public.grading_companies (id, name, code, verification_enabled) VALUES
  ('psa', 'PSA', 'PSA', true),
  ('bgs', 'BGS / Beckett', 'BGS', true),
  ('cgc', 'CGC Cards', 'CGC', true),
  ('sgc', 'SGC Grading', 'SGC', true)
ON CONFLICT (id) DO NOTHING;
```

**To jest ważne** - aplikacja używa tych firm do filtrowania i weryfikacji.

### 3. Storage Buckets (jeśli używane)
Sprawdź, czy potrzebujesz bucketów dla:
- `avatars` - awatary użytkowników
- `certificates` - certyfikaty slabów
- `card-images` - obrazy kart (może być w URL z API)

**Sprawdź**: Czy aplikacja używa Storage? Jeśli tak, utwórz buckety w Supabase Dashboard → Storage.

### 4. Test Aplikacji
Przetestuj, czy aplikacja działa z nową bazą:
- [ ] Uruchom `npm run dev`
- [ ] Sprawdź, czy strona się ładuje
- [ ] Sprawdź, czy nie ma błędów w konsoli
- [ ] Sprawdź, czy marketplace się ładuje (będzie puste, ale nie powinno być błędów)

---

## 🚀 Gotowe do Importu?

Jeśli:
- ✅ Widok `marketplace_cards` istnieje
- ✅ Edge Functions wdrożone
- ✅ Sets zaimportowane
- ✅ Aplikacja działa (bez błędów)

To możesz rozpocząć import kart!

---

## 📝 Szybkie SQL do wykonania (opcjonalne):

Jeśli chcesz dodać kategorie i grading companies przed importem, wykonaj w Supabase Dashboard → SQL Editor:

```sql
-- Dodaj kategorie
INSERT INTO public.categories (id, name, slug, description, enabled) VALUES
  ('pokemon-tcg', 'Pokemon TCG', 'pokemon-tcg', 'Pokemon Trading Card Game', true)
ON CONFLICT (id) DO NOTHING;

-- Dodaj firmy certyfikujące
INSERT INTO public.grading_companies (id, name, code, verification_enabled) VALUES
  ('psa', 'PSA', 'PSA', true),
  ('bgs', 'BGS / Beckett', 'BGS', true),
  ('cgc', 'CGC Cards', 'CGC', true),
  ('sgc', 'SGC Grading', 'SGC', true)
ON CONFLICT (id) DO NOTHING;
```

---

**Data utworzenia**: 2025-01-19

