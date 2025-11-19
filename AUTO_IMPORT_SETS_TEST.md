# Jak przetestować Edge Function auto-import-sets

## Metoda 1: Przycisk "Test" w Dashboard

1. **Przejdź do Edge Functions:**
   - Dashboard → Edge Functions → `auto-import-sets`

2. **Kliknij przycisk "Test"** (ikonka samolotu w prawym górnym rogu)

3. **W oknie testowym:**
   - **Method**: `POST` (powinno być domyślnie)
   - **Query Parameters**: Dodaj `language=english` (opcjonalnie)
   - **Headers**: 
     - Jeśli używasz CRON_SECRET, dodaj:
       ```
       x-cron-secret: Vb7XpXfbubg0aZGVHXLsu8AJ3xafglZ8
       ```
     - Jeśli nie używasz CRON_SECRET, możesz pominąć ten header
   - **Body**: Możesz zostawić puste `{}` lub całkowicie puste

4. **Kliknij "Run"** lub "Invoke"

5. **Sprawdź odpowiedź:**
   - Powinno pokazać JSON z wynikami:
   ```json
   {
     "message": "Auto-import completed",
     "imported": 5,
     "skipped": 150,
     "errors": 0,
     "total": 155,
     "newSets": [...]
   }
   ```

---

## Metoda 2: Przez curl (z terminala)

```bash
curl -X POST "https://xxsnsomathouvuhtshyw.supabase.co/functions/v1/auto-import-sets?language=english" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "x-cron-secret: Vb7XpXfbubg0aZGVHXLsu8AJ3xafglZ8" \
  -H "Content-Type: application/json" \
  -d "{}"
```

**Zastąp `YOUR_SERVICE_ROLE_KEY`** swoim Service Role Key z:
- Dashboard → Settings → API → **service_role** (secret key)

---

## Metoda 3: Przez Postman lub inny HTTP client

**URL:**
```
POST https://xxsnsomathouvuhtshyw.supabase.co/functions/v1/auto-import-sets?language=english
```

**Headers:**
```
Authorization: Bearer YOUR_SERVICE_ROLE_KEY
x-cron-secret: Vb7XpXfbubg0aZGVHXLsu8AJ3xafglZ8
Content-Type: application/json
```

**Body:**
```json
{}
```

---

## Metoda 4: Przez zakładkę "Invocations"

1. Przejdź do **Edge Functions** → `auto-import-sets` → zakładka **"Invocations"**
2. Kliknij **"Test"** (przycisk z samolotem)
3. Wypełnij formularz testowy

---

## Co sprawdzić po teście:

1. **Odpowiedź funkcji:**
   - Czy pokazuje `"message": "Auto-import completed"`
   - Ile setów zostało zaimportowanych (`imported`)
   - Ile zostało pominiętych (`skipped`)

2. **Logi:**
   - Przejdź do zakładki **"Logs"**
   - Sprawdź, czy są jakieś błędy

3. **Baza danych:**
   - Przejdź do **Table Editor** → `sets`
   - Sortuj po `created_at` (descending)
   - Sprawdź, czy nowe sety zostały dodane

---

## Rozwiązywanie problemów:

### Błąd: "Unauthorized"
- Sprawdź, czy używasz **Service Role Key** (nie Anon Key)
- Sprawdź, czy CRON_SECRET jest poprawny (jeśli używasz)

### Błąd: "Missing Supabase environment variables"
- Sprawdź, czy w **Edge Functions → Settings → Secrets** masz ustawione:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

### Funkcja działa, ale nie importuje setów
- Sprawdź logi w zakładce **"Logs"**
- Może wszystkie sety już istnieją w bazie (sprawdź `skipped` w odpowiedzi)

---

## Przykładowa odpowiedź sukcesu:

```json
{
  "message": "Auto-import completed",
  "imported": 3,
  "skipped": 152,
  "errors": 0,
  "total": 155,
  "newSets": [
    { "id": "sv5", "name": "Temporal Forces" },
    { "id": "sv6", "name": "Twilight Masquerade" },
    { "id": "sv7", "name": "Prismatic Evolutions" }
  ]
}
```

---

## Przykładowa odpowiedź gdy wszystko już zaimportowane:

```json
{
  "message": "All sets already imported",
  "imported": 0,
  "skipped": 155,
  "total": 155
}
```

