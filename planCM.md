## Plan realizacji serwisu Cardmarket.com

### 1. Wprowadzenie
- **Cel produktu**: globalna platforma marketplace do kupna, sprzedazy i wymiany kart kolekcjonerskich (TCG/CCG).
- **Model biznesowy**: prowizje od transakcji, oplaty subskrypcyjne za funkcje premium, uslugi reklamowe.
- **Zalozenia**: wysoka dostepnosc, wsparcie wielu jezykow i walut, skalowalnosc do setek tysiecy jednoczesnych uzytkownikow.

### 2. Kluczowe persony
- **Kupujacy kolekcjoner**: szuka konkretnych kart w okreslonym stanie, oczekuje filtrow, alertow cenowych, programu ochrony kupujacego.
- **Sprzedawca-hurtownik**: zarzadza rozbudowanym inwentarzem, potrzebuje importu CSV/API, hurtowych narzedzi cenowych i raportowania sprzedazy.
- **Gracz turniejowy**: priorytetem jest szybkie zdobycie kart, istotna jest wiarygodnosc sprzedawców, stany magazynowe w czasie rzeczywistym, szybka wysylka.

### 3. Podstawowe funkcjonalnosci
- Rejestracja i logowanie (e-mail, social login, 2FA).
- Zarzadzanie kontem, adresami, preferencjami jezykow/walut.
- Katalog kart z wyszukiwarka, filtrowaniem po edycjach, stanie, jezyku, foilu itd.
- Widok oferty produktu: lista sprzedawców z cenami, ocenami, informacja o stanie.
- Koszyk, checkout, obsluga wielu metod platnosci, kalkulacja kosztow wysylki i podatkow.
- Panel sprzedawcy: zarzadzanie ofertami, wystawianie nowych kart, hurtowe aktualizacje cen, integracja z narzedziami cenowymi.
- System wiadomosci miedzy uzytkownikami (kupujacy-sprzedawca), centrum sporow, mechanizm feedbacku i ocen.
- Programy lojalnosciowe oraz funkcje premium (np. price alerts, watchlist, statystyki rynku).
- Admin: moderacja ofert, zarzadzanie kategoriami, polityka bezpieczenstwa, zgodnosc z regulacjami.

### 4. Architektura i technologia
- **Frontend**: SPA/SSR (np. Next.js + React), wielojezykowy UI, komponenty dostepnosci (WCAG AA).
- **Backend**: mikroserwisy lub modularny monolit w Node.js/TypeScript (NestJS) albo Java (Spring), GraphQL/REST Gateway.
- **Baza danych**: relacyjna (PostgreSQL) dla danych transakcyjnych, wyszukiwarka (Elasticsearch) dla kart, Redis do cache.
- **Platnosci**: integracje z PSP (Adyen/Stripe/PayPal) z obsluga wielu walut, SCA, split payments.
- **Logistyka**: API do obliczen kosztu wysylki, integracje z firmami kurierskimi.
- **Infrastruktura**: chmura (AWS/GCP), konteneryzacja (Docker, Kubernetes), CI/CD (GitHub Actions), monitoring (Prometheus, Grafana, ELK).
- **Bezpieczenstwo**: szyfrowanie danych w ruchu i spoczynku, mechanizmy antyfraudowe, rate limiting, audyt logow.

### 5. Plan wdrozenia MVP
1. **Faza Discovery (4-6 tygodni)**: analiza potrzeb, mapowanie UX, definicja backlogu oraz OKR.
2. **MVP Core (12-16 tygodni)**:
   - Katalog kart z podstawowym wyszukiwaniem.
   - Rejestracja, logowanie, profil uzytkownika.
   - Listing sprzedawcow z koszykiem i checkoutem (jedna metoda platnosci).
   - Panel sprzedawcy z wystawianiem ofert i prostym raportowaniem.
3. **Rozszerzenia po MVP (8-12 tygodni)**: system ocen, wiadomosci, geolokalizacja ofert, alerty cenowe, jezyki/waluty.
4. **Stabilizacja i compliance (4 tygodnie)**: testy wydajnosci, pentesty, RODO/GDPR, procedury AML/KYC.

### 6. Testowanie i jakosc
- Strategia testow: unit, integracyjne, e2e (Playwright/Cypress), testy obciazeniowe.
- QA manualne dla krytycznych sciezek (zakup, wystawienie karty, wyplata).
- Monitoring produkcyjny, alerty SLA, zbieranie feedbacku uzytkownikow.

### 7. Metryki sukcesu
- GMV miesieczny, liczba aktywnych sprzedawcow i kupujacych.
- Wspolczynnik konwersji wyszukiwan -> zakup.
- Sredni czas realizacji zamowienia, liczba sporow.
- NPS/Satysfakcja uzytkownikow, retencja sprzedawcow premium.

### 8. Roadmapa dalszego rozwoju
- Aplikacje mobilne (iOS/Android) z push notification.
- Automatyzacja cen (AI dynamic pricing), rekomendacje.
- Integracje z ekosystemem turniejowym i wydarzeniami offline.
- Ekspansja na nowe kategorie (akcesoria, komiksy) i partnerstwa B2B.

