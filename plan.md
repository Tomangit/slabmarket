## Plan realizacji serwisu Slab Market

### 1. Wprowadzenie
- **Cel produktu**: wyspecjalizowany marketplace poswiecony wylacznie ocenionym kartom kolekcjonerskim (slabs) od wszystkich uznanych firm gradingowych.
- **Wartosc unikalna**: start z segmentu Pokemon TCG (angielska wersja serwisu) z planem rozszerzenia na Lorcana, sport, Magic: The Gathering i inne kategorie; weryfikacja autentycznosci poprzez integracje z bazami gradingow; zaawansowane filtrowanie po parametrach slabs; narzedzia inwestycyjne.
- **Model biznesowy**: prowizje od transakcji, pakiety premium dla sprzedawcow profesjonalnych, uslugi escrow i ubezpieczenia przesylek, oplacane wyroznienia ofert.
- **Platforma**: frontend wdrazany na Vercel, backend i dane oparte o Supabase (Postgres, Auth, Storage, Edge Functions).

### 2. Persony uzytkownikow
- **Kolekcjoner premium**: kupuje slabs dla wartosci kolekcjonerskiej, oczekuje dokladnych danych gradingowych, historii cen, alertow.
- **Inwestor**: analizuje trendy rynku, potrzebuje wykresow, indeksow, integracji z API zewnetrznymi oraz raportow podatkowych.
- **Dealer slabs**: zarzadza duzym inwentarzem, wymaga narzedzi do masowego dodawania ofert, integracji magazynowych oraz programow lojalnosciowych.
- **Inspektor autentycznosci (rolnik)**: rola wewnetrzna lub partnerska do recenzji zglaszanych nieprawidlowosci, potrzebuje panelu moderacji.

### 3. Kluczowe funkcjonalnosci
- Rejestracja/login z opcja weryfikacji tozsamosci (KYC) dla transakcji wysokiej wartosci.
- Katalog slabs:
  - normalizacja danych gradingowych (PSA, BGS, CGC, SGC, itp.).
  - zaawansowane filtry (ocena total, subgrades, numer certyfikatu, rok, edycja, pop report).
- Szczegolowy widok slab:
  - zdjecia high-res obustronne, opcja wideo 360.
  - sekcja historii cen i wykresy trendow.
  - weryfikacja certyfikatu w czasie rzeczywistym (API gradingowe).
- Marketplace:
  - aukcje i oferty BIN (kup teraz).
  - escrow protekcja kupujacego, integracja z ubezpieczeniami przesylek.
  - automaty kalkulacji wysylki z opcja temperature-controlled shipping.
  - sekcje Added Today, Hot Deals, Featured na stronie glownej (Featured jako platne wyroznienie).
- Program ochrony kupujacego inspirowany Cardmarket (gwarancja dostawy, polityka zwrotow, transparentny dispute resolution).
- Panel sprzedawcy:
  - import CSV/API powiazany z numerami certyfikatow.
  - zarzadzanie magazynem, monitorowanie stanu slabs, zglaszanie grading reholders.
  - analityka sprzedazy, rekomendacje cenowe na podstawie danych rynkowych.
- Panel inwestorski:
  - watchlisty, alerty cenowe, indeksy rynkowe, raporty ROI.
  - API do eksportu danych (np. do arkuszy).
- Moderacja i compliance:
  - zgłaszanie podejrzanych slabs, dispute resolution, powiazania z networkiem antyfraudowym.
  - audyt logow, RODO/GDPR, AML.

### 4. Architektura i technologia
- **Frontend**: Next.js/React hostowany na Vercel z SSR/ISR dla SEO, biblioteka komponentow zaprojektowana pod katalog slabs, integracja z WebGL/Canvas dla podgladu zdjec oraz lazy loading dla media high-res.
- **Backend/BaaS**: Supabase jako glowna warstwa danych i logiki (Postgres, Auth z magic links/2FA, Storage na zdjecia, Edge Functions dla logiki aukcji i webhookow); dodatkowe serwisy serverless na Vercel Functions dla integracji w czasie rzeczywistym.
- **Warstwa danych wyszukiwania**: Supabase Postgres z full-text search i pgvector dla podobienstwa, cache indeksow w Redis (np. Upstash); ew. migracja do dedykowanego Opensearch przy wzroscie wolumenu.
- **Analityka i historie cen**: TimescaleDB (rozszerzenie Postgresa w Supabase) dla danych czasowych, pipeline ETL (Edge Functions + cron Vercel) zasilajacy dashboardy.
- **Cache i kolejkowanie**: Redis dla rate limiting, kolejek powiadomien i TTL price snapshotow; supabase realtime do powiadomien WebSocket.
- **Integracje zewnetrzne**:
  - API firm gradingowych (PSA Cert, BGS Verify, CGC, SGC, itp.) do walidacji certyfikatow i pobierania metadanych.
  - Dostawcy platnosci z escrow (np. Mangopay, Stripe Connect Custom) z rozliczeniami wielowalutowymi.
  - Serwisy kurierskie z ubezpieczeniami i sledzeniem (Shippo, Easyship) z konfiguracja transportu kontrolowanego temperatury.
- **Infrastruktura**: GitHub Actions do CI/CD na Vercel i Supabase, Terraform do zarzadzania zasobami dodatkowymi (Redis, monitorowanie), observability poprzez Supabase observability stack + Logflare, Sentry i Grafana/Loki dla rozszerzen.
- **Bezpieczenstwo**: KYC (Onfido/Sumsub) dla wysokich progow, szyfrowanie danych w spoczynku (Supabase), tokenizacja kart platniczych, WAF i rate limiting na edge, modele detekcji fraudu (ML) korzystajace z danych transakcyjnych Supabase.

### 5. MVP (12-16 tygodni)
1. **Discovery i warsztaty (3 tyg.)**: user journey, definicja zakresu MVP, wybór partnerow KYC i platnosci.
2. **Rdzen marketplace (6-8 tyg.)**:
   - katalog slabs z importem danych certyfikacyjnych,
   - listing ofert BIN z podstawowa walidacja certyfikatow,
   - checkout z escrow i jedna integracja kurierska,
   - panel sprzedawcy z recznym dodawaniem ofert.
3. **Panel inwestorski lite (2 tyg.)**: watchlisty, alerty cenowe (e-mail).
4. **Moderacja i compliance (1-2 tyg.)**: raportowanie fraudu, procedury KYC, logi audytowe.
5. **Stabilizacja i testy (2 tyg.)**: testy wydajnosci, pentesty, przygotowanie SLA/Support.

### 6. Testowanie i jakosc
- Testy jednostkowe i integracyjne dla serwisow backendowych.
- Testy E2E dla sciezek kupna/sprzedazy i weryfikacji certyfikatu.
- Testy bezpieczenstwa (pentesty, SAST, DAST).
- Program beta z ograniczona liczba sprzedawcow premium.

### 7. Metryki sukcesu
- Wartosc GMV miesieczna oraz marza z escrow/premiums.
- Sredni czas zamkniecia transakcji, liczba udanych weryfikacji certyfikatow.
- Retencja inwestorow (aktywnosc watchlist), liczba aktywnych sprzedawcow.
- Poziom sporów i zwrotów, NPS uzytkownikow premium.

### 8. Roadmapa po MVP
- Wprowadzenie aukcji na zywo (live bidding, streaming).
- Opcja weryfikacji zdjec AI (wykrywanie uszkodzen slab).
- Integracja z magazynami skarbcowymi (vaulting) i wypozyczenia slabs.
- Aplikacje mobilne native z digital wallet.
- Moduly podatkowe per rynek (raporty CSV dla US/EU).
- Rozszerzenie katalogu na Lorcana, sport, Magic: The Gathering oraz inne kategorie slabs.

