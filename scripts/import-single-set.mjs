/**
 * Import kart dla jednego zestawu - do testowania
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { setTimeout as sleep } from "node:timers/promises";
import { v5 as uuidv5 } from "uuid";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const POKEMON_TCG_API_KEY = process.env.POKEMON_TCG_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const PAGE_SIZE = 10;
const API_BASE = "https://api.pokemontcg.io/v2";
const CARD_UUID_NAMESPACE = "3c7c5669-9c35-4d90-9f3f-9ad44e3d8adc";

const setName = process.argv[2];
if (!setName) {
  console.error("Usage: node scripts/import-single-set.mjs <set-name>");
  console.error("Example: node scripts/import-single-set.mjs \"Base\"");
  process.exit(1);
}

console.log(`Importing cards for set: "${setName}"\n`);

// Pobierz zestaw z bazy
const { data: sets, error: setError } = await supabase
  .from("sets")
  .select("id, name, era, language, release_year")
  .eq("name", setName)
  .eq("language", "english")
  .limit(1);

if (setError || !sets || sets.length === 0) {
  console.error(`Set "${setName}" not found in database.`);
  process.exit(1);
}

const set = sets[0];
console.log(`Found set: ${set.name} (ID: ${set.id})\n`);

// Funkcja do pobierania kart
async function fetchCardsForSet(setName, setId) {
  console.log(`Fetching cards for set: "${setName}" (id: ${setId})...`);
  
  const query = `set.id:"${setId}"`;
  const encodedQuery = encodeURIComponent(query);
  let page = 1;
  const cards = [];
  const REQUEST_TIMEOUT = 180000; // 3 minuty timeout

  while (true) {
    const url = `${API_BASE}/cards?q=${encodedQuery}&pageSize=${PAGE_SIZE}&page=${page}`;
    console.log(`  Page ${page}...`);
    
    let response;
    const startTime = Date.now();
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        if (attempt > 1) {
          console.log(`    Retry ${attempt}/3...`);
        }
        
        const headers = {
          "User-Agent": "PokemonTCG-Import-Script/1.0",
        };
        if (POKEMON_TCG_API_KEY) {
          headers["X-Api-Key"] = POKEMON_TCG_API_KEY;
        }
        
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Request timeout")), REQUEST_TIMEOUT);
        });
        
        const fetchPromise = fetch(url, { headers });
        
        response = await Promise.race([fetchPromise, timeoutPromise]);
        const elapsed = Date.now() - startTime;
        
        console.log(`    Status: ${response.status} (${elapsed}ms)`);
        
        if (response.ok) {
          break;
        }
        
        // Jeśli to błąd 504 (Gateway Timeout) i mamy już jakieś karty, kontynuuj z tym co mamy
        if (response.status === 504 && cards.length > 0 && attempt === 3) {
          console.log(`    ⚠ Gateway Timeout (504) - continuing with ${cards.length} cards already fetched`);
          return cards; // Zwróć to, co udało się pobrać
        }
        
        if (attempt === 3) {
          const body = await response.text();
          // Jeśli mamy już jakieś karty, zwróć je zamiast rzucać błąd
          if (cards.length > 0) {
            console.log(`    ⚠ API error (${response.status}) - continuing with ${cards.length} cards already fetched`);
            return cards;
          }
          throw new Error(`API error (${response.status}): ${body.substring(0, 200)}`);
        }
        
        await sleep(2000 * attempt);
      } catch (error) {
        if (error.message.includes('timeout')) {
          console.log(`    Timeout after ${Date.now() - startTime}ms`);
          if (attempt === 3) {
            // Jeśli mamy już jakieś karty, zwróć je zamiast rzucać błąd
            if (cards.length > 0) {
              console.log(`    ⚠ Request timeout - continuing with ${cards.length} cards already fetched`);
              return cards;
            }
            throw new Error(`Request timeout after ${REQUEST_TIMEOUT}ms`);
          }
        } else if (attempt === 3) {
          // Jeśli mamy już jakieś karty, zwróć je zamiast rzucać błąd
          if (cards.length > 0) {
            console.log(`    ⚠ Error: ${error.message} - continuing with ${cards.length} cards already fetched`);
            return cards;
          }
          throw error;
        }
        await sleep(2000 * attempt);
      }
    }

    const json = await response.json();
    const batch = json.data ?? [];
    cards.push(...batch);
    
    console.log(`    ✓ Got ${batch.length} cards (total: ${cards.length})`);

    if (batch.length < PAGE_SIZE) {
      break;
    }

    page += 1;
    await sleep(2000); // 2 sekundy między stronami
  }

  console.log(`  ✓ Total: ${cards.length} cards\n`);
  return cards;
}

// Mapowanie kart
function mapCardPayload(card, set) {
  const uniqueKey = `${set.name}::${card.name}::${card.number ?? ""}`;
  const uuid = uuidv5(uniqueKey, CARD_UUID_NAMESPACE);
  return {
    id: uuid,
    name: card.name,
    set_name: set.name,
    year: set.release_year ?? (card.releaseDate ? Number(card.releaseDate.slice(0, 4)) : null),
    card_number: card.number ?? null,
    rarity: card.rarity ?? null,
    image_url: card.images?.large ?? card.images?.small ?? null,
    description: card.flavorText ?? null,
    category_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// Sprawdź istniejące karty
async function getExistingCardsKeys(setName) {
  const { data, error } = await supabase
    .from("cards")
    .select("name, set_name, card_number")
    .eq("set_name", setName);
  
  if (error) {
    throw new Error(`Failed to fetch existing cards: ${error.message}`);
  }
  
  const keys = new Set();
  for (const card of data || []) {
    const key = `${card.set_name}::${card.name}::${card.card_number ?? ""}`;
    keys.add(key);
  }
  return keys;
}

// Zapisz karty
async function upsertCards(cards, setName) {
  console.log(`Processing ${cards.length} cards...`);
  
  const existingKeys = await getExistingCardsKeys(setName);
  const newCards = cards.filter((card) => {
    const key = `${card.set_name}::${card.name}::${card.card_number ?? ""}`;
    return !existingKeys.has(key);
  });
  
  if (newCards.length === 0) {
    console.log(`All cards already exist. Skipping.`);
    return;
  }
  
  console.log(`Inserting ${newCards.length} new cards...`);
  
  const chunkSize = 100; // Mniejsze chunki
  for (let i = 0; i < newCards.length; i += chunkSize) {
    const chunk = newCards.slice(i, i + chunkSize);
    const { error } = await supabase.from("cards").insert(chunk);
    
    if (error) {
      throw new Error(`Failed to insert: ${error.message}`);
    }
    
    console.log(`  ✓ Inserted chunk ${Math.floor(i / chunkSize) + 1} (${chunk.length} cards)`);
    await sleep(200);
  }
  
  console.log(`✓ Successfully inserted ${newCards.length} cards\n`);
}

// Main
try {
  let cards = [];
  try {
    cards = await fetchCardsForSet(set.name, set.id);
  } catch (fetchError) {
    console.error(`\n⚠ Error fetching cards: ${fetchError.message}`);
    console.log(`  Continuing with ${cards.length} cards already fetched...`);
  }
  
  if (!cards.length) {
    console.log("No cards found.");
    process.exit(0);
  }
  
  console.log(`\nProcessing ${cards.length} fetched cards...`);
  
  const uniqueApiCards = Array.from(
    cards.reduce((acc, card) => {
      const key = `${set.name}::${card.name}::${card.number ?? ""}`;
      if (!acc.has(key)) {
        acc.set(key, card);
      }
      return acc;
    }, new Map()).values(),
  );
  
  console.log(`  After deduplication: ${uniqueApiCards.length} unique cards`);
  
  const mapped = uniqueApiCards.map((card) => mapCardPayload(card, set));
  await upsertCards(mapped, set.name);
  
  console.log(`\n✓ Done! Imported ${mapped.length} cards for ${set.name}`);
  if (cards.length < uniqueApiCards.length) {
    console.log(`  Note: Some cards may be missing due to API errors.`);
  }
} catch (error) {
  console.error(`\n✗ Fatal Error: ${error.message}`);
  if (error.stack) {
    console.error(`  Stack: ${error.stack.split('\n').slice(0, 3).join('\n')}`);
  }
  process.exit(1);
}

