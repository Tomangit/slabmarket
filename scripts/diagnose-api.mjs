import "dotenv/config";
import https from "https";
import { lookup } from "dns/promises";

const API_BASE = "https://api.pokemontcg.io/v2";
const API_HOST = "api.pokemontcg.io";

console.log("=== Diagnostyka połączenia z PokemonTCG API ===\n");

// Test 1: DNS Resolution
console.log("1. Sprawdzanie rozpoznawania DNS...");
let ipv4Address = null;
try {
  const addresses = await lookup(API_HOST, { family: 4 });
  ipv4Address = addresses.address;
  console.log(`   ✓ DNS IPv4 rozpoznany: ${ipv4Address}`);
} catch (error) {
  console.log(`   ⚠ Nie można rozpoznać IPv4, próbuję IPv6...`);
  try {
    const addresses = await lookup(API_HOST, { family: 6 });
    console.log(`   ✓ DNS IPv6 rozpoznany: ${addresses.address}`);
    console.log(`   ⚠ Ostrzeżenie: IPv6 może powodować problemy z połączeniem`);
  } catch (error2) {
    console.error(`   ✗ Błąd DNS: ${error.message}`);
    process.exit(1);
  }
}

// Test 2: Basic connectivity test
console.log("\n2. Test podstawowej łączności (timeout 20s)...");
function testConnectivity() {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const options = {
      hostname: API_HOST,
      path: "/v2/sets?pageSize=1",
      port: 443,
      method: 'GET',
      timeout: 20000,
    };
    
    // Force IPv4 if available
    if (ipv4Address) {
      options.family = 4;
    }
    
    const req = https.request(options, (res) => {
      const elapsed = Date.now() - startTime;
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        console.log(`   Status: ${res.statusCode} (${elapsed}ms)`);
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            console.log(`   ✓ Połączenie działa! Otrzymano ${json.data?.length || 0} zestawów`);
            resolve(true);
          } catch (e) {
            console.log(`   ⚠ Otrzymano odpowiedź, ale błąd parsowania JSON`);
            resolve(false);
          }
        } else {
          console.log(`   ⚠ Status ${res.statusCode}: ${data.substring(0, 100)}`);
          resolve(false);
        }
      });
    });
    
    req.on("error", (error) => {
      const elapsed = Date.now() - startTime;
      console.log(`   ✗ Błąd połączenia (${elapsed}ms): ${error.message}`);
      if (error.code === "ETIMEDOUT" || error.code === "ECONNRESET") {
        console.log(`   ⚠ Możliwy problem: timeout lub reset połączenia`);
        console.log(`   Sugestie:`);
        console.log(`     - Sprawdź firewall/antywirus`);
        console.log(`     - Sprawdź ustawienia proxy`);
        console.log(`     - Sprawdź czy API jest dostępne: https://status.pokemontcg.io`);
      }
      reject(error);
    });
    
    req.setTimeout(20000, () => {
      req.destroy();
      reject(new Error("Timeout po 20 sekundach"));
    });
    
    req.end();
  });
}

try {
  await testConnectivity();
  console.log("\n✓ Połączenie z API działa poprawnie!");
} catch (error) {
  console.error(`\n✗ Problem z połączeniem: ${error.message}`);
  console.log("\nMożliwe rozwiązania:");
  console.log("1. Sprawdź połączenie internetowe");
  console.log("2. Sprawdź ustawienia firewall/antywirus");
  console.log("3. Sprawdź ustawienia proxy w systemie");
  console.log("4. Sprawdź status API: https://status.pokemontcg.io");
  console.log("5. Spróbuj użyć VPN jeśli jesteś za firewallem korporacyjnym");
  process.exit(1);
}

