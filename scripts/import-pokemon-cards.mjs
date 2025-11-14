/**
 * Script that downloads cards for all sets stored in Supabase
 * and upserts them into the `cards` table.
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { setTimeout as sleep } from "node:timers/promises";
import { v5 as uuidv5 } from "uuid";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const POKEMON_TCG_API_KEY = process.env.POKEMON_TCG_API_KEY;

console.log("=== Starting Pokemon Card Import ===");
console.log(`SUPABASE_URL: ${SUPABASE_URL ? "✓ Set" : "✗ Missing"}`);
console.log(`SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY ? "✓ Set" : "✗ Missing"}`);
console.log(`POKEMON_TCG_API_KEY: ${POKEMON_TCG_API_KEY ? "✓ Set" : "⚠ Not set (using free tier)"}`);

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
console.log("Supabase client initialized\n");

const PAGE_SIZE = 10; // Kompromis między szybkością a stabilnością - API często timeoutuje
const API_BASE = "https://api.pokemontcg.io/v2";
const CARD_UUID_NAMESPACE = "3c7c5669-9c35-4d90-9f3f-9ad44e3d8adc"; // arbitrary, but constant

async function fetchSets({ language, setFilter }) {
  console.log("Fetching sets from Supabase...");
  let query = supabase
    .from("sets")
    .select("id, name, era, language, release_year")
    .order("language")
    .order("era")
    .order("name");
  
  // Note: 'id' field contains the PokemonTCG API set ID (e.g., 'base1', 'base4')
  // We'll use this directly for faster API queries

  if (language) {
    console.log(`  Filtering by language: ${language}`);
    query = query.eq("language", language);
  }

  const { data, error } = await query;
  if (error) {
    console.error(`  ✗ Error fetching sets: ${error.message}`);
    throw new Error(`Failed to load sets from Supabase: ${error.message}`);
  }

  const sets = data ?? [];
  console.log(`  ✓ Found ${sets.length} sets in database`);
  
  if (setFilter) {
    const filtered = sets.filter((set) => set.name.toLowerCase() === setFilter.toLowerCase());
    console.log(`  Filtered to ${filtered.length} set(s) matching "${setFilter}"`);
    return filtered;
  }
  return sets;
}

async function fetchCardsForSet(setName, setId) {
  console.log(`  Fetching cards for set: "${setName}" (id: ${setId})`);
  
  // Always use set.id from database - it's the PokemonTCG API set ID and much faster
  if (!setId) {
    throw new Error(`Set ID is required for "${setName}"`);
  }
  
  const query = `set.id:"${setId}"`;
  console.log(`    Using set.id query: ${query}`);
  
  const encodedQuery = encodeURIComponent(query);
  let page = 1;
  const cards = [];
  const REQUEST_TIMEOUT = 120000; // 120 seconds (2 minuty) - timeouty są obsłużone, zwracamy częściowe wyniki

  while (true) {
    const url = `${API_BASE}/cards?q=${encodedQuery}&pageSize=${PAGE_SIZE}&page=${page}`;
    console.log(`    Requesting page ${page}...`);
    console.log(`    URL: ${url.substring(0, 100)}...`);
    
    let response;
    const startTime = Date.now();
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        if (attempt > 1) {
          console.log(`    Retry attempt ${attempt}/3...`);
        }
        
        console.log(`    Starting fetch (attempt ${attempt})...`);
        
        const fetchStart = Date.now();
        
        // Build headers - zgodnie z dokumentacją API
        const headers = {
          "User-Agent": "PokemonTCG-Import-Script/1.0",
        };
        if (process.env.POKEMON_TCG_API_KEY) {
          headers["X-Api-Key"] = process.env.POKEMON_TCG_API_KEY;
        }
        
        // Użyj Promise.race dla timeoutu zamiast AbortController
        // (AbortController może mieć problemy z niektórymi wersjami Node.js)
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            console.log(`    Timeout triggered after ${REQUEST_TIMEOUT}ms`);
            reject(new Error(`Request timeout after ${REQUEST_TIMEOUT}ms`));
          }, REQUEST_TIMEOUT);
        });
        
        const fetchPromise = fetch(url, {
          headers,
        });
        
        response = await Promise.race([fetchPromise, timeoutPromise]);
        const elapsed = Date.now() - startTime;
        const fetchElapsed = Date.now() - fetchStart;
        console.log(`    Response received: status ${response.status} (fetch: ${fetchElapsed}ms, total: ${elapsed}ms)`);

        if (response.ok) {
          console.log(`    ✓ Request successful`);
          break;
        }
        
        console.log(`    ✗ Request failed with status ${response.status}`);
        
        if (attempt === 3) {
          const body = await response.text();
          // Jeśli mamy już jakieś karty, zwróć je zamiast rzucać błąd
          if (cards.length > 0) {
            console.log(`    ⚠ API error (${response.status}) after 3 attempts - zwracam ${cards.length} kart pobranych do tej pory`);
            return cards;
          }
          throw new Error(`PokemonTCG API error (${response.status}) after ${attempt} attempts: ${body.substring(0, 200)}`);
        }
        
        // Dłuższe opóźnienia dla 504 (API przeciążone)
        const backoffDelay = response?.status === 504 
          ? 5000 * attempt // 5s, 10s, 15s dla 504
          : 2000 * Math.pow(2, attempt - 1); // 2s, 4s, 8s dla innych błędów
        console.log(`    Waiting ${backoffDelay}ms before retry (API może być przeciążone)...`);
        await sleep(backoffDelay);
      } catch (error) {
        const elapsed = Date.now() - startTime;
        if (error.message.includes('timeout') || error.message.includes('Timeout')) {
          console.error(`    ✗ Request timeout after ${elapsed}ms`);
          if (attempt === 3) {
            // Jeśli timeout po 3 próbach, zwróć karty które udało się pobrać do tej pory
            console.log(`    ⚠ Timeout after 3 attempts - zwracam ${cards.length} kart pobranych do tej pory`);
            if (cards.length > 0) {
              return cards; // Zwróć częściowo pobrane karty
            }
            throw new Error(`Request timeout after ${REQUEST_TIMEOUT}ms - no cards fetched`);
          }
        } else {
          console.error(`    ✗ Error: ${error.message}`);
          if (attempt === 3) {
            // Jeśli błąd po 3 próbach, zwróć karty które udało się pobrać
            if (cards.length > 0) {
              console.log(`    ⚠ Error after 3 attempts - zwracam ${cards.length} kart pobranych do tej pory`);
              return cards;
            }
            throw error;
          }
        }
        const backoffDelay = 2000 * Math.pow(2, attempt - 1); // Dłuższe opóźnienia
        console.log(`    Waiting ${backoffDelay}ms before retry...`);
        await sleep(backoffDelay);
      }
    }

    if (!response || !response.ok) {
      // Jeśli mamy już jakieś karty, zwróć je zamiast rzucać błąd
      if (cards.length > 0) {
        console.log(`    ⚠ Response not OK (${response?.status || 'unknown'}) - zwracam ${cards.length} kart pobranych do tej pory`);
        return cards;
      }
      throw new Error(`Failed to fetch cards: response is not OK`);
    }

    console.log(`    Parsing response...`);
    const json = await response.json();
    const batch = json.data ?? [];
    cards.push(...batch);

    console.log(`    ✓ Page ${page}: ${batch.length} cards (total: ${cards.length})`);

    if (batch.length < PAGE_SIZE) {
      console.log(`    Last page reached (${batch.length} < ${PAGE_SIZE})`);
      break;
    }

    page += 1;
    console.log(`    Waiting 2000ms before next page...`);
    await sleep(2000); // Opóźnienie - API potrzebuje czasu między zapytaniami
  }

  console.log(`  ✓ Total cards fetched: ${cards.length}`);
  return cards;
}

function mapCardPayload(card, set) {
  // Generate deterministic UUID based on unique constraint: name + set_name + card_number
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

async function getExistingCardsKeys(setName) {
  console.log(`  Checking existing cards in database for "${setName}"...`);
  const { data, error } = await supabase
    .from("cards")
    .select("name, set_name, card_number")
    .eq("set_name", setName);
  
  if (error) {
    console.error(`  ✗ Error fetching existing cards: ${error.message}`);
    throw new Error(`Failed to fetch existing cards: ${error.message}`);
  }
  
  // Create a Set of unique keys
  const keys = new Set();
  for (const card of data || []) {
    const key = `${card.set_name}::${card.name}::${card.card_number ?? ""}`;
    keys.add(key);
  }
  console.log(`  ✓ Found ${keys.size} existing cards in database`);
  return keys;
}

async function upsertCards(cards, setName) {
  console.log(`  Processing ${cards.length} cards for insertion...`);
  
  // First, get existing cards to avoid duplicates
  const existingKeys = await getExistingCardsKeys(setName);
  
  // Filter out cards that already exist
  const newCards = cards.filter((card) => {
    const key = `${card.set_name}::${card.name}::${card.card_number ?? ""}`;
    return !existingKeys.has(key);
  });
  
  if (newCards.length === 0) {
    console.log(`  ✓ All ${cards.length} cards from this batch already exist in database.`);
    console.log(`  ⚠ Uwaga: To może oznaczać, że zestaw jest częściowo zaimportowany.`);
    return { inserted: 0, skipped: cards.length };
  }
  
  console.log(`  → ${newCards.length} new cards to insert (${cards.length - newCards.length} already exist).`);
  
  const chunkSize = 500;
  const totalChunks = Math.ceil(newCards.length / chunkSize);
  console.log(`  Inserting in ${totalChunks} chunk(s) of up to ${chunkSize} cards each...`);
  
  for (let i = 0; i < newCards.length; i += chunkSize) {
    const chunk = newCards.slice(i, i + chunkSize);
    const chunkNum = Math.floor(i / chunkSize) + 1;
    console.log(`    Inserting chunk ${chunkNum}/${totalChunks} (${chunk.length} cards)...`);
    
    const { error } = await supabase
      .from("cards")
      .insert(chunk);
    
    if (error) {
      console.error(`    ✗ Error inserting chunk: ${error.message}`);
      throw new Error(`Failed to insert cards: ${error.message}`);
    }
    
    console.log(`    ✓ Chunk ${chunkNum} inserted successfully`);
    await sleep(100);
  }
  
  console.log(`  ✓ All ${newCards.length} new cards inserted successfully`);
  return { inserted: newCards.length, skipped: cards.length - newCards.length };
}

async function main() {
  const args = process.argv.slice(2);
  const languageArgIndex = args.indexOf("--language");
  const language = languageArgIndex !== -1 ? args[languageArgIndex + 1] : undefined;
  const setFilterIndex = args.indexOf("--set");
  const setFilter = setFilterIndex !== -1 ? args[setFilterIndex + 1] : undefined;
  const limitIndex = args.indexOf("--limit");
  const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1], 10) : undefined;

  const sets = await fetchSets({ language, setFilter });
  if (!sets.length) {
    console.log("No sets found with current filters. Nothing to import.");
    return;
  }

  // Pomiń zestawy które już mają karty (przyspiesza import)
  console.log("Sprawdzanie które zestawy już mają karty...");
  const { data: existingCards } = await supabase
    .from("cards")
    .select("set_name");
  
  const setsWithCards = new Set((existingCards || []).map(c => c.set_name));
  const setsToProcess = sets.filter(set => !setsWithCards.has(set.name));
  
  console.log(`  Zestawy z kartami: ${setsWithCards.size}`);
  console.log(`  Zestawy do importu: ${setsToProcess.length}`);
  
  if (setsToProcess.length === 0) {
    console.log("✓ Wszystkie zestawy już mają karty!");
    return;
  }

  const setsToImport = limit ? setsToProcess.slice(0, limit) : setsToProcess;
  console.log(`Importing ${setsToImport.length} set(s) (${limit ? `limited to ${limit}` : "all sets"})...\n`);

  for (const set of setsToImport) {
    console.log(`\n[${new Date().toISOString()}] Importing set: ${set.name} (${set.language})`);
    console.log("─".repeat(60));
    try {
      // Use set.id from database (it's the PokemonTCG API set ID)
      const cards = await fetchCardsForSet(set.name, set.id);
      if (!cards.length) {
        console.log(`  ⚠ No cards found for ${set.name}. Skipping.`);
        continue;
      }

      console.log(`  Deduplicating ${cards.length} cards from API...`);
      // Deduplicate cards from API before mapping (some sets may have duplicate entries)
      const uniqueApiCards = Array.from(
        cards.reduce((acc, card) => {
          const key = `${set.name}::${card.name}::${card.number ?? ""}`;
          if (!acc.has(key)) {
            acc.set(key, card);
          }
          return acc;
        }, new Map()).values(),
      );
      console.log(`  ✓ After deduplication: ${uniqueApiCards.length} unique cards`);

      console.log(`  Mapping cards to database format...`);
      const mapped = uniqueApiCards.map((card) => mapCardPayload(card, set));
      console.log(`  ✓ Mapped ${mapped.length} cards`);

      // Zapisuj karty - nawet jeśli import się nie dokończył, zapisz to co udało się pobrać
      if (mapped.length > 0) {
        const result = await upsertCards(mapped, set.name);
        console.log(`\n✓ Successfully processed ${mapped.length} cards for ${set.name} (${cards.length} total from API).`);
        if (result.inserted > 0) {
          console.log(`  → Wstawiono ${result.inserted} nowych kart`);
        }
        if (result.skipped > 0) {
          console.log(`  → Pominięto ${result.skipped} kart (już istnieją)`);
        }
      } else {
        console.log(`\n⚠ No cards to import for ${set.name}`);
      }
    } catch (error) {
      console.error(`\n✗ Error during import of ${set.name}:`);
      console.error(`  Error: ${error.message}`);
      
      // Spróbuj zapisać częściowo pobrane karty jeśli są
      // fetchCardsForSet zwraca karty nawet przy timeoutach
      if (error.message.includes('timeout') || error.message.includes('504') || error.message.includes('no cards fetched')) {
        console.log(`  ⚠ Timeout/504 error - sprawdzam czy są częściowo pobrane karty...`);
        // Jeśli fetchCardsForSet zwróciło karty przed timeoutem, będą one w zmiennej cards
        // Ale tutaj nie mamy do nich dostępu, więc musimy sprawdzić w bazie
        const { count } = await supabase
          .from("cards")
          .select("*", { count: "exact", head: true })
          .eq("set_name", set.name);
        console.log(`  → Obecnie w bazie: ${count || 0} kart dla ${set.name}`);
      }
      
      if (error.stack) {
        console.error(`  Stack: ${error.stack.split('\n').slice(0, 3).join('\n')}`);
      }
    }
  }

  console.log("Done.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
