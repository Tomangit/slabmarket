# Zadania do wykonania BEZ zakładania firmy

## 📋 Priorytetyzacja według wpływu i łatwości wykonania

### 🟢 **WYSOKI PRIORYTET - Można zrobić od razu**

#### 1. **Integracja z Redis/Upstash** ⚠️ **NISKI PRIORYTET - Tylko jeśli masz problem z wydajnością**
**Plik:** `next_steps.md` - punkt 4
**Status:** Nie potrzebne na start (masz już indeksy DB i optymalizacje)

**Kiedy będzie potrzebne:**
- ❌ NIE TERAZ - dla MVP i małego ruchu nie jest potrzebne
- ✅ Dopiero gdy: >100k wizyt/dzień lub problemy z wydajnością
- ✅ Albo gdy potrzebujesz rate limiting (ochrona przed spamem)
- ✅ Albo gdy skalujesz na wiele instancji

**Obecna sytuacja:**
- Masz już optymalizacje (indeksy DB, paginacja, React.memo)
- Supabase ma własną warstwę cache
- Cache w pamięci (`src/lib/cache.ts`) jest przygotowany, ale nie używany (i nie musi być na razie)

**Co zrobić (gdy będzie potrzebne):**
- Zainstalować `@upstash/redis` i `@upstash/ratelimit`
- Stworzyć serwis cache używający Upstash Redis
- Dodać rate limiting do API endpoints
- Migracja z `src/lib/cache.ts` na Redis-based cache
- Cache wyników wyszukiwania (marketplace queries)
- Kolejki powiadomień w Redis

**Benefity:**
- Darmowy tier Upstash (10k requestów/dzień)
- Lepsze cache (persystentny vs. memory)
- Rate limiting zabezpiecza API
- Gotowe na skalowanie

**Szacowany czas:** 2-4 godziny (ale nie rób teraz!)

**Rekomendacja:** ⏭️ **POMIŃ NA RAZIE** - skoncentruj się na funkcjach biznesowych

---

#### 2. **Rozbudowa pipeline ETL dla kart Pokemon** ✅ (ukończone)
**Plik:** `next_steps.md` - punkt 5
**Status:** Ulepszony pipeline działa (`scripts/import-pokemon-cards-enhanced.mjs`)

**Co już jest:**
- ✅ Normalizacja danych (slug generation, deduplikacja zaawansowana)
- ✅ Walidacja poprawności danych (schematy JSON Schema)
- ✅ Automatyczne rozpoznawanie dubli (fuzzy matching)
- ✅ Dokumentacja procedury aktualizacji (`scripts/etl/README.md`)
- ✅ Obsługa obrazów: pobieranie z API, upload do Supabase Storage (opcjonalne)
- ✅ Mapowanie certyfikatów (PSA/BGS/CGC formaty)
- ✅ Migracja dla pola `slug` w tabeli `cards`
- ✅ Testy automatyczne dla funkcji ETL (`scripts/etl/__tests__/utils.test.js` - 40 testów)

**Benefity:**
- Lepsza jakość danych
- Mniej błędów przy importach
- Automatyzacja przyszłych aktualizacji

**Szacowany czas:** ~1 godzina (testy) lub pominąć na razie

---

#### 3. **Historia cen i indeksy rynkowe** ✅ (ukończone)
**Plik:** `next_steps.md` - punkt 9
**Status:** Pełna funkcjonalność działa (Edge Function, serwis, wykresy, cron job)

**Co już jest:**
- ✅ Edge Function `update-price-history` istnieje
- ✅ Serwis `priceHistoryService` z kalkulacją indeksów (PSA 10 Index, Grade Index)
- ✅ Komponent `PriceHistoryChart` z wykresami (Recharts)
- ✅ API endpoint do pobierania historii cen
- ✅ Cron job skonfigurowany dla automatycznej aktualizacji historii cen (codziennie o północy UTC)

**Co jeszcze zrobić (opcjonalne):**
- Migracja `price_history` na TimescaleDB (rozszerzenie Postgres) - opcjonalne, tylko jeśli będzie dużo danych
- Dedykowany dashboard inwestorski z indeksami (obecnie funkcjonalność jest w różnych miejscach)

**Benefity:**
- Lepsza wydajność dla dużej ilości danych (TimescaleDB)
- Automatyczna aktualizacja historii cen
- Centralny dashboard do analizy rynku

**Szacowany czas:** 2-4 godziny

---

#### 4. **Testy integracyjne dla ETL** ✅ (częściowo ukończone)
**Plik:** `next_steps.md` - punkt 7
**Status:** Testy jednostkowe ETL istnieją

**Co już jest:**
- ✅ Testy jednostkowe dla funkcji ETL (`scripts/etl/__tests__/utils.test.js` - 40 testów)
- ✅ Testy Edge Functions (`supabase/functions/_tests/`)
- ✅ Testy walidacji danych
- ✅ Testy deduplikacji i fuzzy matching

**Co jeszcze zrobić (opcjonalne):**
- Testy integracyjne importu kart (`__tests__/import.test.ts`) - wymaga mockowania Pokemon TCG API
- Mockowanie Pokemon TCG API dla testów integracyjnych
- CI/CD pipeline do automatycznych testów (można dodać do istniejącego workflow)

**Benefity:**
- Pewność, że import działa poprawnie
- Łatwiejsze debugowanie
- Gotowe na produkcję

**Szacowany czas:** 3-4 godziny

---

### 🟡 **ŚREDNI PRIORYTET - Wartościowe, ale mniej pilne**

#### 6. **Wdrożenie Logflare dla monitoringu** ⏳
**Plik:** `next_steps.md` - punkt 2
**Status:** Brak

**Co zrobić:**
- Integracja Logflare z Supabase
- Dashboard logów (błędy, wydajność)
- Alerty email/Slack przy błędach
- Query language do analizy logów

**Benefity:**
- Lepsze debugowanie
- Monitoring wydajności
- Szybsze reagowanie na problemy

**Szacowany czas:** 1-2 godziny

---

#### 7. **Projekt UX/UI - makety** ✅ (ukończone)
**Plik:** `next_steps.md` - punkt 3
**Status:** Dokumentacja UX/UI utworzona

**Co zostało zrobione:**
- ✅ Design System (kolory, typografia, spacing, komponenty)
- ✅ Szczegółowe wireframes dla kluczowych ekranów:
  - Landing page
  - Marketplace (katalog/wyszukiwarka)
  - Card detail page
  - Slab detail page
  - Shopping cart
  - Checkout
  - Seller dashboard
- ✅ Specyfikacja UX dla Added Today, Hot Deals, Featured
- ✅ User flows dla głównych scenariuszy (kupowanie, sprzedawanie, ochrona)
- ✅ Interaction patterns i micro-interactions
- ✅ Mobile-first considerations
- ✅ Accessibility guidelines

**Dokumentacja:**
- `docs/UX_UI_DESIGN_SYSTEM.md` - Design system i komponenty
- `docs/WIREFRAMES.md` - Szczegółowe wireframes ASCII
- `docs/USER_FLOWS.md` - User flows i interaction patterns

**Następne kroki (opcjonalne):**
- Przeniesienie do Figma/Sketch dla high-fidelity mockups
- User testing z wireframes
- Iteracja na podstawie feedbacku

**Benefity:**
- Jasna wizja produktu
- Łatwiejsze planowanie implementacji
- Gotowe do przeniesienia do narzędzi designowych
- Możliwość testowania z użytkownikami

**Szacowany czas:** 8-16 godzin (w zależności od poziomu szczegółowości) - ✅ Ukończone

---

#### 8. **Rozszerzenie na kolejne kategorie** ⏳
**Plik:** `next_steps.md` - punkt 9
**Status:** Tylko Pokemon

**Co zrobić:**
- Analiza API dla Lorcana, Sport Cards, MTG
- Adaptacja ETL pipeline dla innych kategorii
- Kategorie i filtry dla nowych kategorii
- Import danych dla Lorcana (najprostsze - najnowsze)

**Benefity:**
- Większy rynek
- Więcej użytkowników
- Różnicowanie produktu

**Szacowany czas:** 4-6 godzin na kategorię

---

#### 9. **Dokumentacja użytkownika** ✅ (częściowo ukończone)
**Plik:** `next_steps.md` - punkt 8
**Status:** Podstawowa dokumentacja utworzona

**Co już jest:**
- ✅ Centrum Pomocy (`/help`) z kategoriami
- ✅ FAQ z filtrowaniem po kategoriach (`/help/faq`)
- ✅ Przewodnik dla kupujących (`/help/buying`) - jak kupować, ochrona kupującego
- ✅ Przewodnik dla sprzedawców (`/help/selling`) - jak wystawić slab, bulk tools
- ✅ Strona bezpieczeństwa (`/help/safety`) - weryfikacja, escrow, rozwiązywanie sporów
- ✅ Linki w headerze i footerze

**Co jeszcze zrobić (opcjonalne):**
- Tutoriale video (lub screenshoty) - można dodać później
- Integracja z aplikacją (help tooltips) - można dodać później
- Rozszerzenie FAQ o więcej pytań w miarę potrzeb

**Benefity:**
- Mniej support tickets
- Lepszy UX
- Gotowe na launch

**Szacowany czas:** 4-8 godzin (częściowo ukończone - ~4 godziny)

---

#### 10. **Finalizacja copy i assetów marketingowych** ⏳
**Plik:** `next_steps.md` - punkt 8
**Status:** Podstawowy copy istnieje

**Co zrobić:**
- Landing page copy (hero, features, CTA)
- Email templates (welcome, transaction, notifications)
- FAQ (rozszerzone)
- Blog posts (SEO)
- Social media content

**Benefity:**
- Lepszy marketing
- SEO
- Profesjonalny wygląd

**Szacowany czas:** 4-6 godzin

---

### 🔵 **NISKI PRIORYTET - Do zrobienia później**

#### 11. **Testy bezpieczeństwa i obciążeniowe** ⏳
**Plik:** `next_steps.md` - punkt 7
**Status:** Podstawowe testy istnieją

**Co zrobić:**
- SAST (Static Application Security Testing) - GitHub Security
- DAST (Dynamic) - OWASP ZAP lub Burp Suite
- Load testing (k6, Artillery) dla wyszukiwania i checkout
- Security audit dependencies (`npm audit`, Snyk)

**Benefity:**
- Bezpieczeństwo aplikacji
- Gotowe na produkcję
- Zgodność z wymaganiami

**Szacowany czas:** 4-6 godzin

---

#### 12. **PWA i aplikacja mobilna** ⏳
**Plik:** `next_steps.md` - punkt 9
**Status:** Brak

**Co zrobić:**
- Konfiguracja PWA (manifest.json, service worker)
- Responsive design improvements
- Offline support (cache API responses)
- Push notifications
- App icons i splash screens

**Benefity:**
- Lepszy UX na mobile
- Możliwość instalacji jako app
- Gotowe na native app (później)

**Szacowany czas:** 6-10 godzin

---

## 🎯 **Rekomendowany plan działania (kolejność)**

### **Tydzień 1-2: Fundacja techniczna**
1. ⏭️ Redis/Upstash integration (POMIŃ - nie potrzebne na start)
2. ⏳ Rozbudowa ETL pipeline (walidacja, normalizacja)
3. ⏳ Testy integracyjne dla ETL

### **Tydzień 3: Automatyzacja i dane**
4. ⏳ Historia cen i indeksy rynkowe (częściowo - brak cron joba i opcjonalnego TimescaleDB)

### **Tydzień 4: UX i dokumentacja**
5. ⏳ Projekt UX/UI (makety)
6. ⏳ Dokumentacja użytkownika
7. ⏳ Finalizacja copy

### **Tydzień 5+: Rozbudowa**
8. ⏳ Rozszerzenie na Lorcana
9. ⏳ Logflare monitoring
10. ⏳ PWA
11. ⏳ Testy bezpieczeństwa

---

## ⚠️ **Czego NIE można zrobić bez firmy:**

❌ Integracja Stripe Connect/Mangopay (wymaga firmy)
❌ KYC (Onfido/Sumsub) - wymaga firmy
❌ Integracja z prawdziwymi API gradingowych (często wymaga umowy)
❌ Integracja z serwisami kurierskimi (wymaga kontraktu)
❌ RODO/GDPR compliance (wymaga rejestracji)
❌ Podpisanie umów z dostawcami

**ALE:** Można przygotować kod i stuby, które po rejestracji firmy będą łatwe do włączenia!

---

## 💡 **Porady:**

1. **Automatyzuj ETL** - oszczędza czas w przyszłości
2. **Rób makety** - łatwo testować z użytkownikami bez kodowania
3. **Dokumentuj** - łatwiej będzie później z onboardingiem użytkowników
4. **Testuj bezpieczeństwo** - ważne, ale można zrobić później
5. **Skonfiguruj cron joba dla historii cen** - ważne dla automatycznego zbierania danych

---

## 📊 **Szacowany czas:**
- **Wysoki priorytet:** ~15-25 godzin (zostało ~10-15 godzin)
- **Średni priorytet:** ~30-40 godzin  
- **Niski priorytet:** ~20-30 godzin

**RAZEM:** ~65-95 godzin pracy (2-3 miesiące w wolnym tempie)

**Ukończone:**
- ✅ Automatyzacja importu nowych setów (Edge Function + cron job)
- ✅ Historia cen i indeksy rynkowe (Edge Function, serwis, wykresy, cron job)

- ✅ Implementacja slugów dla kart (automatyczne generowanie, routing, fallback)
- ✅ Rozbudowa pipeline ETL dla kart Pokemon (normalizacja, walidacja, deduplikacja, testy)
- ✅ Testy jednostkowe dla funkcji ETL (40 testów pokrywających wszystkie funkcje)
- ✅ SEO optimization (meta tags, structured data, sitemap, robots.txt, favicon)
- ✅ Projekt UX/UI - makety (design system, wireframes, user flows, dokumentacja)

