import "dotenv/config";

const API_KEY = process.env.POKEMON_TCG_API_KEY;
const API_BASE = "https://api.pokemontcg.io/v2";
const REQUEST_TIMEOUT = 30000; // 30 seconds

console.log("Testing PokemonTCG API connection...");
console.log(`API Key: ${API_KEY ? "Set" : "Not set"}`);
console.log(`API Base URL: ${API_BASE}\n`);

// Helper function for making API requests
async function makeRequest(url, description) {
  const startTime = Date.now();
  console.log(`${description}...`);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log(`   ⚠ Timeout after ${REQUEST_TIMEOUT}ms, aborting...`);
      controller.abort();
    }, REQUEST_TIMEOUT);
    
    const headers = {};
    
    // PokemonTCG API requires X-Api-Key header if using API key
    // Content-Type is not required for GET requests
    if (API_KEY) {
      headers["X-Api-Key"] = API_KEY;
    }
    
    console.log(`   URL: ${url}`);
    console.log(`   Headers: ${JSON.stringify(Object.keys(headers))}`);
    
    const response = await fetch(url, {
      headers,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    const elapsed = Date.now() - startTime;
    
    console.log(`   Status: ${response.status} (${elapsed}ms)`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✓ Success!`);
      return { success: true, data, elapsed };
    } else {
      const text = await response.text();
      console.log(`   ✗ Error ${response.status}: ${text.substring(0, 300)}`);
      return { success: false, status: response.status, error: text, elapsed };
    }
  } catch (error) {
    const elapsed = Date.now() - startTime;
    if (error.name === 'AbortError') {
      console.log(`   ✗ Request timeout after ${elapsed}ms`);
    } else {
      console.log(`   ✗ Error after ${elapsed}ms: ${error.message}`);
      if (error.stack) {
        console.log(`   Stack: ${error.stack.split('\n').slice(0, 2).join('\n')}`);
      }
    }
    return { success: false, error: error.message, elapsed };
  }
}

// Test 1: Simple sets query
const test1 = await makeRequest(
  `${API_BASE}/sets?pageSize=1`,
  "1. Testing simple sets query (pageSize=1)"
);

if (test1.success && test1.data) {
  console.log(`   Got ${test1.data.data?.length || 0} sets`);
  if (test1.data.data && test1.data.data.length > 0) {
    console.log(`   First set: "${test1.data.data[0].name}" (id: ${test1.data.data[0].id})`);
  }
}

// Test 2: Cards query with set.id (properly encoded)
console.log("\n2. Testing cards query with set.id (base1)...");
const query = 'set.id:"base1"';
const encodedQuery = encodeURIComponent(query);
const test2 = await makeRequest(
  `${API_BASE}/cards?q=${encodedQuery}&pageSize=5`,
  "   Query"
);

if (test2.success && test2.data) {
  console.log(`   Got ${test2.data.data?.length || 0} cards`);
  if (test2.data.data && test2.data.data.length > 0) {
    console.log(`   First card: "${test2.data.data[0].name}" from set "${test2.data.data[0].set?.name}"`);
  }
}

// Summary
console.log("\n" + "=".repeat(60));
console.log("Summary:");
console.log(`  Test 1 (Sets): ${test1.success ? "✓ PASSED" : "✗ FAILED"} (${test1.elapsed}ms)`);
console.log(`  Test 2 (Cards): ${test2.success ? "✓ PASSED" : "✗ FAILED"} (${test2.elapsed}ms)`);


