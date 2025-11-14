import "dotenv/config";

const API_KEY = process.env.POKEMON_TCG_API_KEY;
const setName = "Base";

console.log(`Testing API with set name: "${setName}"`);

// Test 1: Check what sets exist with "Base" in name
console.log("\n1. Checking sets with 'Base' in name...");
const setsResponse = await fetch(`https://api.pokemontcg.io/v2/sets?q=name:*Base*&pageSize=5`, {
  headers: {
    "X-Api-Key": API_KEY || "",
  },
});
const setsData = await setsResponse.json();
console.log(`Found ${setsData.data?.length || 0} sets:`);
setsData.data?.forEach((s) => console.log(`  - "${s.name}" (id: ${s.id})`));

// Test 2: Try to fetch cards with exact name "Base"
console.log(`\n2. Testing cards query with set.name:"${setName}"...`);
const encoded = encodeURIComponent(`set.name:"${setName}"`);
const url = `https://api.pokemontcg.io/v2/cards?q=${encoded}&pageSize=5`;
console.log(`URL: ${url}`);

const startTime = Date.now();
try {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout for test
  
  const response = await fetch(url, {
    headers: {
      "X-Api-Key": API_KEY || "",
    },
    signal: controller.signal,
  });
  
  clearTimeout(timeoutId);
  const elapsed = Date.now() - startTime;
  
  console.log(`Response status: ${response.status} (${elapsed}ms)`);
  if (response.ok) {
    const data = await response.json();
    console.log(`Found ${data.data?.length || 0} cards`);
    if (data.data && data.data.length > 0) {
      console.log("First card:", data.data[0].name, "from set:", data.data[0].set.name);
    }
  } else {
    const text = await response.text();
    console.log(`Error response: ${text.substring(0, 200)}`);
  }
} catch (error) {
  const elapsed = Date.now() - startTime;
  console.error(`Error after ${elapsed}ms:`, error.message);
}


