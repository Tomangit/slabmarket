# Import Kart w Wszystkich Językach

## ⚠️ Ważne: Procesy Node.js

W systemie są uruchomione procesy Node.js. Przed rozpoczęciem nowego importu możesz:

1. **Zatrzymać wszystkie procesy Node.js** (jeśli chcesz):
   ```powershell
   # Windows PowerShell
   Get-Process node | Stop-Process -Force
   ```

2. **Lub sprawdzić, które procesy to importy**:
   ```powershell
   Get-Process node | Select-Object Id, ProcessName, StartTime
   ```

## 🚀 Uruchomienie Importu

### Opcja 1: Automatyczny Import Wszystkich Języków (ZALECANE)

```bash
node scripts/import-all-languages.mjs
```

Ten skrypt:
- ✅ Importuje sety dla wszystkich języków (english, polish, french, german, spanish, italian, portuguese)
- ✅ Importuje karty dla wszystkich języków
- ✅ Używa `upsert` - nie duplikuje istniejących danych
- ✅ Automatycznie pomija sety, które już mają karty
- ✅ Wyświetla szczegółowe podsumowanie

### Opcja 2: Ręczny Import (jeśli chcesz kontrolować proces)

```bash
# Najpierw sety dla wszystkich języków
node scripts/import-pokemon-sets.mjs --language english
node scripts/import-pokemon-sets.mjs --language polish
node scripts/import-pokemon-sets.mjs --language french
# itd.

# Potem karty dla wszystkich języków
node scripts/import-pokemon-cards.mjs --language english
node scripts/import-pokemon-cards.mjs --language polish
node scripts/import-pokemon-cards.mjs --language french
# itd.
```

## ⏱️ Szacowany Czas

- **Sety**: ~1-2 minuty na język (7 języków = ~10-15 minut)
- **Karty**: ~10-30 minut na język (7 języków = ~1-3 godziny)
- **Razem**: ~1.5-3.5 godziny

## 📊 Co Zostanie Zaimportowane

- ✅ **English** (USA/Kanada/Wielka Brytania)
- ✅ **Polish** (Polska)
- ✅ **French** (Francja/Kanada)
- ✅ **German** (Niemcy/Austria)
- ✅ **Spanish** (Hiszpania/Ameryka Łacińska)
- ✅ **Italian** (Włochy)
- ✅ **Portuguese** (Portugalia/Brazylia)

- ❌ **Japanese** (pominięte)
- ❌ **Korean** (pominięte)
- ❌ **Chinese** (pominięte)

## 🔄 Co Zostanie Zachowane

- ✅ Istniejące listingi (slabs) - **NIE ZOSTANĄ USUNIĘTE**
- ✅ Istniejące karty - zostaną zaktualizowane (upsert)
- ✅ Istniejące sety - zostaną zaktualizowane (upsert)

## 📝 Po Zakończeniu Importu

1. Sprawdź w aplikacji, czy karty są widoczne w różnych językach
2. Sprawdź filtry językowe na stronie szczegółów karty
3. Sprawdź, czy możesz wybrać język przy dodawaniu nowego listingu

## ⚠️ Uwagi

- API Pokemon TCG może być wolne i zwracać błędy timeout
- Skrypt automatycznie kontynuuje przy błędach
- Możesz przerwać import (Ctrl+C) i wznowić później - skrypt używa upsert, więc nie będzie duplikatów







