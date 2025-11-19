/**
 * Minimalny importer kart dla pierwszego seta Lorcany (The First Chapter).
 * Na razie: pobiera dane z api.lorcana-api.com i wypisuje podsumowanie.
 * Nie zapisuje jeszcze do bazy – to krok 2 (mapowanie do schematu `cards`).
 */
import "dotenv/config";

const API_BASE = "https://api.lorcana-api.com";
const SET_NAME = "The First Chapter";

function encodeQuery(params) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) usp.set(k, String(v));
  });
  return usp.toString();
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      "Accept": "application/json; charset=utf-8",
      "User-Agent": "SM-Lorcana-Import/0.1",
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Request failed ${res.status}: ${text || res.statusText}`);
  }
  return res.text();
}

async function main() {
  console.log("=== Lorcana: import pierwszego seta (read-only) ===");
  const query = encodeQuery({ set: SET_NAME });
  const endpoints = [
    `${API_BASE}/cards/fetch?${query}`,
    `${API_BASE}/cards/all?${query}`,
    `${API_BASE}/api/cards?${query}`,
    `${API_BASE}/cards?${query}`,
    `${API_BASE}/v1/cards?${query}`,
  ];
  let data;
  let lastErr;

  for (const url of endpoints) {
    console.log("Trying:", url);
    try {
      const text = await fetchText(url);
      try {
        data = JSON.parse(text);
        break;
      } catch (e) {
        // Keep error and try next shape
        lastErr = new Error(`Non-JSON response preview: ${text.slice(0, 120)}...`);
      }
    } catch (e) {
      lastErr = e;
    }
  }
  if (!data) {
    throw lastErr || new Error("No valid JSON endpoint found");
  }
  if (!Array.isArray(data)) {
    console.log("Unexpected response shape:", typeof data);
    console.dir(data, { depth: 2 });
    process.exit(1);
  }

  console.log(`Pobrano kart: ${data.length} (set: "${SET_NAME}")`);

  // Podgląd 5 rekordów z kluczowymi polami
  data.slice(0, 5).forEach((c, i) => {
    const preview = {
      name: c?.name,
      number: c?.number,
      rarity: c?.rarity,
      set: c?.set,
      image: c?.image || c?.image_url || c?.images?.[0],
    };
    console.log(`#${i + 1}`, preview);
  });

  console.log("\nOK. Dane są – następny krok: mapowanie do schematu `cards` i zapis do Supabase.");
  console.log("Możesz uruchomić: node scripts/import-lorcana-first-set.mjs");
}

main().catch((err) => {
  console.error("Błąd importu:", err);
  process.exit(1);
});


