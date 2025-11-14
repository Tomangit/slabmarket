import "dotenv/config";
import https from "https";

const API_KEY = process.env.POKEMON_TCG_API_KEY;
const API_BASE = "https://api.pokemontcg.io/v2";

console.log("Testing PokemonTCG API with native https module...");
console.log(`API Key: ${API_KEY ? "Set" : "Not set"}\n`);

function makeRequest(path, useApiKey = true) {
  return new Promise((resolve, reject) => {
    const url = `${API_BASE}${path}`;
    console.log(`Requesting: ${url}`);
    console.log(`Using API Key: ${useApiKey && API_KEY ? "Yes" : "No"}`);
    
    const options = {
      headers: {},
    };
    
    if (useApiKey && API_KEY) {
      options.headers["X-Api-Key"] = API_KEY;
    }
    
    const startTime = Date.now();
    const req = https.get(url, options, (res) => {
      let data = "";
      
      res.on("data", (chunk) => {
        data += chunk;
      });
      
      res.on("end", () => {
        const elapsed = Date.now() - startTime;
        console.log(`Status: ${res.statusCode} (${elapsed}ms)`);
        
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            resolve({ success: true, data: json, elapsed });
          } catch (e) {
            reject(new Error(`Failed to parse JSON: ${e.message}`));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 200)}`));
        }
      });
    });
    
    req.on("error", (error) => {
      const elapsed = Date.now() - startTime;
      reject(new Error(`Request error after ${elapsed}ms: ${error.message}`));
    });
    
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error("Request timeout after 30s"));
    });
    
    req.end();
  });
}

// Test 1: With API key
console.log("\n=== Test 1: With API Key ===");
try {
  const result = await makeRequest("/sets?pageSize=1", true);
  console.log(`✓ Success! Got ${result.data.data?.length || 0} sets`);
  if (result.data.data && result.data.data.length > 0) {
    console.log(`First set: "${result.data.data[0].name}" (id: ${result.data.data[0].id})`);
  }
} catch (error) {
  console.error(`✗ Error: ${error.message}`);
}

// Test 2: Without API key (free tier)
console.log("\n=== Test 2: Without API Key (Free Tier) ===");
try {
  const result = await makeRequest("/sets?pageSize=1", false);
  console.log(`✓ Success! Got ${result.data.data?.length || 0} sets`);
  if (result.data.data && result.data.data.length > 0) {
    console.log(`First set: "${result.data.data[0].name}" (id: ${result.data.data[0].id})`);
  }
} catch (error) {
  console.error(`✗ Error: ${error.message}`);
}

