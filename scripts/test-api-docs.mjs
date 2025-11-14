import "dotenv/config";

/**
 * Test zgodny z dokumentacją PokemonTCG API v2
 * Dokumentacja: https://docs.pokemontcg.io/
 */

const API_KEY = process.env.POKEMON_TCG_API_KEY;
const API_BASE = "https://api.pokemontcg.io/v2";

console.log("=== Test API zgodny z dokumentacją PokemonTCG ===\n");
console.log(`API Base: ${API_BASE}`);
console.log(`API Key: ${API_KEY ? "✓ Ustawiony" : "⚠ Nie ustawiony (free tier)"}\n`);

// Zgodnie z dokumentacją, nagłówek User-Agent może być pomocny
// oraz X-Api-Key dla autoryzacji
async function testAPI(endpoint, description) {
  console.log(`\n${description}`);
  console.log(`Endpoint: ${endpoint}`);
  
  const startTime = Date.now();
  
  try {
    const headers = {
      "User-Agent": "PokemonTCG-Import-Script/1.0",
    };
    
    if (API_KEY) {
      headers["X-Api-Key"] = API_KEY;
    }
    
    console.log(`Headers: ${JSON.stringify(Object.keys(headers))}`);
    
    // Użyj Promise.race zamiast AbortController dla lepszej kompatybilności
    // Zwiększony timeout - API może być wolne (sets ~13s, cards ~45-60s)
    const timeout = endpoint.includes('/cards') ? 60000 : 60000; // 60s dla obu - API może być niestabilne
    
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error("Request timeout")), timeout);
    });
    
    const fetchPromise = fetch(`${API_BASE}${endpoint}`, {
      method: "GET",
      headers,
    }).then(response => {
      // Anuluj timeout jeśli fetch się zakończył
      if (timeoutId) clearTimeout(timeoutId);
      return response;
    }).catch(error => {
      if (timeoutId) clearTimeout(timeoutId);
      throw error;
    });
    
    const response = await Promise.race([fetchPromise, timeoutPromise]);
    const elapsed = Date.now() - startTime;
    
    console.log(`Status: ${response.status} ${response.statusText} (${elapsed}ms)`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✓ Sukces!`);
      
      // Sprawdź strukturę odpowiedzi zgodnie z dokumentacją
      if (data.data) {
        console.log(`  Otrzymano ${data.data.length} wyników`);
        if (data.page) {
          console.log(`  Strona: ${data.page} z ${data.pageSize || 'N/A'} wyników na stronę`);
        }
        if (data.count) {
          console.log(`  Łączna liczba: ${data.count}`);
        }
        if (data.totalCount) {
          console.log(`  Całkowita liczba: ${data.totalCount}`);
        }
        
        // Pokaż pierwszy wynik jeśli istnieje
        if (data.data.length > 0) {
          const first = data.data[0];
          if (first.name) {
            console.log(`  Przykład: "${first.name}"`);
          }
          if (first.id) {
            console.log(`  ID: ${first.id}`);
          }
        }
      } else {
        console.log(`  ⚠ Brak pola 'data' w odpowiedzi`);
        console.log(`  Struktura: ${JSON.stringify(Object.keys(data)).substring(0, 200)}`);
      }
      
      return { success: true, data, elapsed };
    } else {
      const text = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(text);
      } catch (e) {
        errorData = { message: text };
      }
      
      console.log(`✗ Błąd ${response.status}:`);
      console.log(`  ${JSON.stringify(errorData).substring(0, 300)}`);
      
      // Sprawdź typowe błędy z dokumentacji
      if (response.status === 429) {
        console.log(`  ⚠ Rate limit przekroczony - poczekaj przed kolejnym zapytaniem`);
      } else if (response.status === 401) {
        console.log(`  ⚠ Problem z autoryzacją - sprawdź klucz API`);
      } else if (response.status === 404) {
        console.log(`  ⚠ Endpoint nie znaleziony - sprawdź URL`);
      }
      
      return { success: false, status: response.status, error: errorData, elapsed };
    }
  } catch (error) {
    const elapsed = Date.now() - startTime;
    
    if (error.name === 'AbortError') {
      console.log(`✗ Timeout po ${elapsed}ms`);
      console.log(`  ⚠ Zapytanie przekroczyło limit czasu`);
      console.log(`  Możliwe przyczyny:`);
      console.log(`    - Problem z siecią/firewallem`);
      console.log(`    - API jest przeciążone`);
      console.log(`    - Zapytanie jest zbyt złożone`);
    } else {
      console.log(`✗ Błąd po ${elapsed}ms: ${error.message}`);
    }
    
    return { success: false, error: error.message, elapsed };
  }
}

// Test 1: Proste zapytanie o zestawy (sets)
console.log("=".repeat(60));
const test1 = await testAPI("/sets?pageSize=1", "Test 1: Pobieranie zestawów");

// Test 2: Zapytanie o karty z prostym query
console.log("\n" + "=".repeat(60));
const query = encodeURIComponent('set.id:"base1"');
const test2 = await testAPI(`/cards?q=${query}&pageSize=5`, "Test 2: Wyszukiwanie kart (set.id:base1)");

// Test 3: Sprawdzenie rate limits - sprawdź nagłówki odpowiedzi
console.log("\n" + "=".repeat(60));
console.log("Test 3: Sprawdzanie nagłówków odpowiedzi (rate limits)");
try {
  const headers = {
    "User-Agent": "PokemonTCG-Import-Script/1.0",
  };
  if (API_KEY) {
    headers["X-Api-Key"] = API_KEY;
  }
  
  const response = await fetch(`${API_BASE}/sets?pageSize=1`, {
    method: "GET",
    headers,
  });
  
  console.log("Nagłówki odpowiedzi:");
  const rateLimitHeaders = [
    'x-ratelimit-limit',
    'x-ratelimit-remaining',
    'x-ratelimit-reset',
    'retry-after'
  ];
  
  for (const header of rateLimitHeaders) {
    const value = response.headers.get(header);
    if (value) {
      console.log(`  ${header}: ${value}`);
    }
  }
  
  if (response.status === 200) {
    console.log("✓ Zapytanie zakończone sukcesem");
  }
} catch (error) {
  console.log(`✗ Błąd: ${error.message}`);
}

// Podsumowanie
console.log("\n" + "=".repeat(60));
console.log("PODSUMOWANIE:");
console.log(`  Test 1 (Sets): ${test1.success ? "✓ PASSED" : "✗ FAILED"} (${test1.elapsed}ms)`);
console.log(`  Test 2 (Cards): ${test2.success ? "✓ PASSED" : "✗ FAILED"} (${test2.elapsed}ms)`);

if (!test1.success && !test2.success) {
  console.log("\n⚠ Wszystkie testy nie powiodły się.");
  console.log("Możliwe przyczyny:");
  console.log("1. Problem z połączeniem sieciowym/firewallem");
  console.log("2. API jest niedostępne lub przeciążone");
  console.log("3. Nieprawidłowy klucz API (jeśli używany)");
  console.log("4. Rate limit przekroczony");
  console.log("\nSprawdź dokumentację: https://docs.pokemontcg.io/");
  process.exit(1);
} else {
  console.log("\n✓ API działa poprawnie!");
}

