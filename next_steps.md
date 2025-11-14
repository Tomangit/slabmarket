## Next Steps: Slab Market

### 1. Przygotowanie organizacyjne
- Okreslenie budzetu, harmonogramu i macierzy odpowiedzialnosci (RACI) dla kluczowych obszarow: produkt, development, dane, compliance.
- Zdefiniowanie wymagan prawnych (regulamin, polityka prywatnosci, AML/KYC, podatki) i rozpoczecie wspolpracy z kancelaria.
- Wybor dostawcow KYC (Onfido/Sumsub), platnosci (Stripe Connect/Mangopay) i logistyki (Shippo/Easyship) oraz podpisanie umow.
- Stworzenie backlogu produktowego w narzedziu do zarzadzania projektem (np. Linear/Jira) wraz z priorytetyzacja MVP.

### 2. Setup technologiczny
- Wdrozenie monitoringu (Sentry, Logflare) oraz podstawowego alertingu.
- Skonfigurowanie CI/CD pipeline (GitHub Actions) dla automatycznego deployowania.

### 3. Projekt UX/UI i design system
- Opracowanie makiet low/high fidelity dla kluczowych ekranow: landing, katalog, karta produktu, koszyk, checkout, panel sprzedawcy, panel inwestora.
- Przygotowanie specyfikacji UX dla sekcji Added Today, Hot Deals, Featured oraz przeplywow ochrony kupujacego i sporow.

### 4. Implementacja backendu i modeli danych
- Integracja z Redis/Upstash dla kolejek powiadomien, rate limiting i cache wynikow wyszukiwania.

### 5. Import i normalizacja danych Pokemon slabs
- Lista firm gradingowych (PSA, BGS, CGC, SGC, PCA, itp.) i mapowanie ich formatow certyfikatow.
- Zbudowanie pipeline ETL:
  - pozyskanie danych kart (nazwy, numery, warianty, rarity, holo/foil) z oficjalnych API/csv (np. Pokemon TCG API);
  - normalizacja (slug, atrybuty, rozpoznawanie dubli).
- Pobranie obrazow wysokiej jakosci (front/back) z licencjonowanych zrodel lub poprzez partnerstwo; zapis w Supabase Storage z CDN.
- Mapowanie certyfikatow: import numerow slabs, ocen, subgrades, data gradingu, populacja (pop report) jesli dostepna.
- Walidacja poprawnosci danych, przygotowanie testow automatycznych dla ETL oraz dokumentacja procedury aktualizacji.

### 6. Integracje krytyczne
- Integracja z prawdziwym Stripe Connect/Mangopay dla platnosci escrow (obecnie stub).
- KYC: onboarding sprzedawcow + limitowanie transakcji wysokiej wartosci.
- Integracja z prawdziwymi API gradingowych dla weryfikacji certyfikatow w czasie rzeczywistym (obecnie stub).
- Integracja z prawdziwymi serwisami kurierskimi dla sledzenia przesylek (obecnie kalkulator kosztów).

### 7. Testy i jakosc
- Jednostkowe/integracyjne testy backendu (Edge Functions, ETL), testy e2e (Playwright/Cypress) kluczowych sciezek zakupowych.
- Testy bezpieczenstwa (SAST/DAST, pentesty zewnetrzne), testy obciazeniowe wyszukiwania i checkoutu.
- Pilotaż z wybranymi sprzedawcami slabs w celu zebrania feedbacku.

### 8. Przygotowanie do launchu
- Finalizacja copy i assetow marketingowych (landing, e-maile, FAQ).
- Ustalenie cennika (prowizje, oplaty za Featured, ubezpieczenie) i konfiguracja w systemie.
- Dokumentacja uzytkownika (sprzedawcy/kupujacy) i szkolenia dla supportu.
- Wdrozenie RODO/GDPR (rejestr czynnosci, DPIA) oraz przygotowanie raportow podatkowych.
- Soft launch (beta) → monitorowanie metryk, iteracja, nastepnie public launch.

### 9. Rozbudowa po MVP
- Automatyzacja importu nowych setow (Pokemon) i stworzenie harmonogramu aktualizacji (cron + walidacja roznic).
- Rozszerzenie na kolejne kategorie (Lorcana, sport, MTG): powtorzenie procesu ETL, dostosowanie filtrow, ewentualne licencje.
- Wdrozenie historii cen i indeksow (TimescaleDB), dashboardy inwestorskie, integracje API do eksportu.
- Rozwój aplikacji mobilnej (PWA → native) i dodatkowych jezykow.

### 10. Utrzymanie i operacje
- Ustanowienie procedur aktualizacji danych (monitoring pipeline ETL, notyfikacje bledow).
- Regularne audyty bezpieczenstwa i zgodnosci (KYC, AML, GDPR).
- Budowanie community: newsletter, social media, partnerstwa z graderami i dealerami.
- Analiza metryk (GMV, retencja, skutecznosc Featured) oraz kwartalne planowanie roadmapy.
