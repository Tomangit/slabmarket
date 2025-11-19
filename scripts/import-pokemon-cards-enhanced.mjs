/**
 * Enhanced Pokemon Cards Import Script
 * Features:
 * - Data normalization (slug generation)
 * - Data validation (JSON Schema-like validation)
 * - Advanced deduplication (fuzzy matching)
 * - Image upload to Supabase Storage (optional)
 * - Certificate format detection
 * - Comprehensive error handling and logging
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { setTimeout as sleep } from "node:timers/promises";
import { v5 as uuidv5 } from "uuid";
import crypto from "crypto";
import {
  normalizeCard,
  validateCard,
  generateCardSlug,
  findPotentialDuplicates,
  uploadImageToStorage,
  detectCertificateFormat,
} from "./etl/utils.js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const POKEMON_TCG_API_KEY = process.env.POKEMON_TCG_API_KEY;

// Configuration flags
const UPLOAD_IMAGES_TO_STORAGE = process.env.UPLOAD_CARD_IMAGES === "true";
const FUZZY_MATCHING_ENABLED = process.env.FUZZY_MATCHING !== "false"; // Default: enabled
const SIMILARITY_THRESHOLD = parseFloat(process.env.SIMILARITY_THRESHOLD || "0.85");

console.log("=== Enhanced Pokemon Card Import ===");
console.log(`SUPABASE_URL: ${SUPABASE_URL ? "✓ Set" : "✗ Missing"}`);
console.log(`SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY ? "✓ Set" : "✗ Missing"}`);
console.log(`POKEMON_TCG_API_KEY: ${POKEMON_TCG_API_KEY ? "✓ Set" : "⚠ Not set (using free tier)"}`);
console.log(`Upload images to storage: ${UPLOAD_IMAGES_TO_STORAGE ? "✓ Enabled" : "✗ Disabled"}`);
console.log(`Fuzzy matching: ${FUZZY_MATCHING_ENABLED ? "✓ Enabled" : "✗ Disabled"}`);
console.log(`Similarity threshold: ${SIMILARITY_THRESHOLD}`);

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
console.log("Supabase client initialized\n");

const PAGE_SIZE = 10; // Kompromis między szybkością a stabilnością - API często timeoutuje
const API_BASE = "https://api.pokemontcg.io/v2";
const CARD_UUID_NAMESPACE = "3c7c5669-9c35-4d90-9f3f-9ad44e3d8adc"; // arbitrary, but constant

// Statistics
const stats = {
  total: 0,
  inserted: 0,
  skipped: 0,
  validationErrors: 0,
  duplicateDetections: 0,
  imageUploads: 0,
  imageUploadErrors: 0,
};

async function fetchSets({ language, setFilter }) {
  console.log("Fetching sets from Supabase...");
  let query = supabase
    .from("sets")
    .select("id, name, era, language, release_year")
    .order("language")
    .order("era")
    .order("name");

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

  // Prefer set.id (PokemonTCG API short ID), but fall back to set.name when ID is missing/looks malformed
  let query;
  const idLooksInvalid = !setId || setId.includes("--") || setId.length > 50;
  if (!idLooksInvalid) {
    query = `set.id:"${setId}"`;
    console.log(`    Using set.id query: ${query}`);
  } else {
    // Fallback: query by set.name to avoid skipping sets; this groups warianty (unlimited/shadowless) pod jednym setem
    query = `set.name:"${setName.replace(/"/g, '\\"')}"`;
    console.log(`    Using fallback set.name query: ${query}`);
  }

  const encodedQuery = encodeURIComponent(query);
  let page = 1;
  const cards = [];
  const REQUEST_TIMEOUT = 60000;

  while (true) {
    const url = `${API_BASE}/cards?q=${encodedQuery}&pageSize=${PAGE_SIZE}&page=${page}`;
    console.log(`    Requesting page ${page}...`);

    let response;
    const startTime = Date.now();

    try {
      const headers = {
        "User-Agent": "PokemonTCG-Import-Script/2.0",
      };
      if (POKEMON_TCG_API_KEY) {
        headers["X-Api-Key"] = POKEMON_TCG_API_KEY;
      }

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Request timeout after ${REQUEST_TIMEOUT}ms`));
        }, REQUEST_TIMEOUT);
      });

      const fetchPromise = fetch(url, { headers });
      response = await Promise.race([fetchPromise, timeoutPromise]);
      const elapsed = Date.now() - startTime;

      if (response.ok) {
        console.log(`    ✓ Request successful (${elapsed}ms)`);
      } else {
        const body = await response.text();
        if (cards.length > 0) {
          console.log(`    ⚠ API error (${response.status}) - zwracam ${cards.length} kart pobranych do tej pory`);
          return cards;
        }
        throw new Error(`PokemonTCG API error (${response.status}): ${body.substring(0, 200)}`);
      }
    } catch (error) {
      const elapsed = Date.now() - startTime;
      if (error.message.includes("timeout") || error.message.includes("Timeout")) {
        console.error(`    ✗ Request timeout after ${elapsed}ms`);
        if (cards.length > 0) {
          console.log(`    ⚠ Timeout - zwracam ${cards.length} kart pobranych do tej pory`);
          return cards;
        }
        throw new Error(`Request timeout after ${REQUEST_TIMEOUT}ms - no cards fetched`);
      } else {
        console.error(`    ✗ Error: ${error.message}`);
        if (cards.length > 0) {
          console.log(`    ⚠ Error - zwracam ${cards.length} kart pobranych do tej pory`);
          return cards;
        }
        throw error;
      }
    }

    const json = await response.json();
    const batch = json.data ?? [];
    cards.push(...batch);

    console.log(`    ✓ Page ${page}: ${batch.length} cards (total: ${cards.length})`);

    if (batch.length < PAGE_SIZE) {
      console.log(`    Last page reached (${batch.length} < ${PAGE_SIZE})`);
      break;
    }

    page += 1;
    await sleep(1000);
  }

  console.log(`  ✓ Total cards fetched: ${cards.length}`);
  return cards;
}

function mapCardPayload(card, set) {
  // Normalize card data using ETL utils
  const normalized = normalizeCard(card, set);

  // Generate deterministic UUID
  const uniqueKey = `${set.name}::${card.name}::${card.number ?? ""}`;
  const uuid = uuidv5(uniqueKey, CARD_UUID_NAMESPACE);

  return {
    id: uuid,
    ...normalized,
    category_id: normalized.category_id ?? 'pokemon-tcg',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

async function getExistingCards(setName) {
  console.log(`  Checking existing cards in database for "${setName}"...`);
  const { data, error } = await supabase
    .from("cards")
    .select("id, name, set_name, card_number, slug")
    .eq("set_name", setName);

  if (error) {
    console.error(`  ✗ Error fetching existing cards: ${error.message}`);
    throw new Error(`Failed to fetch existing cards: ${error.message}`);
  }

  console.log(`  ✓ Found ${data?.length || 0} existing cards in database`);
  return data || [];
}

async function upsertCards(newCards, setName, existingCards) {
  console.log(`  Processing ${newCards.length} cards for insertion...`);

  // Create lookup maps
  const existingKeys = new Set();
  const existingBySlug = new Map();
  for (const card of existingCards) {
    const key = `${card.set_name}::${card.name}::${card.card_number ?? ""}`;
    existingKeys.add(key);
    if (card.slug) {
      existingBySlug.set(card.slug, card);
    }
  }

  // Filter out exact duplicates
  const cardsToProcess = newCards.filter((card) => {
    const key = `${card.set_name}::${card.name}::${card.card_number ?? ""}`;
    return !existingKeys.has(key);
  });

  if (cardsToProcess.length === 0) {
    console.log(`  ✓ All ${newCards.length} cards from this batch already exist in database.`);
    stats.skipped += newCards.length;
    return { inserted: 0, skipped: newCards.length };
  }

  console.log(`  → ${cardsToProcess.length} new cards to process (${newCards.length - cardsToProcess.length} exact duplicates skipped).`);

  // Validate and filter cards
  const validCards = [];
  const invalidCards = [];

  for (const card of cardsToProcess) {
    const validation = validateCard(card);
    if (validation.valid) {
      validCards.push(card);
    } else {
      invalidCards.push({ card, errors: validation.errors });
      stats.validationErrors++;
      console.warn(`    ⚠ Validation error for card "${card.name}": ${validation.errors.join(", ")}`);
    }
  }

  // Fuzzy matching if enabled
  let cardsToInsert = validCards;
  if (FUZZY_MATCHING_ENABLED && existingCards.length > 0) {
    console.log(`  Running fuzzy matching (threshold: ${SIMILARITY_THRESHOLD})...`);
    const duplicates = [];
    
    for (const card of validCards) {
      const potentialDuplicates = findPotentialDuplicates(card, existingCards, SIMILARITY_THRESHOLD);
      if (potentialDuplicates.length > 0) {
        duplicates.push({ card, matches: potentialDuplicates });
        stats.duplicateDetections++;
        console.log(`    ⚠ Potential duplicate: "${card.name}" (similarity: ${(potentialDuplicates[0].similarity * 100).toFixed(1)}%)`);
        console.log(`      Matches: ${potentialDuplicates.map(m => `"${m.card.name}" (${(m.similarity * 100).toFixed(1)}%)`).join(", ")}`);
      }
    }

    // Filter out potential duplicates (you can modify this logic)
    cardsToInsert = validCards.filter(card => {
      const potentialDuplicates = findPotentialDuplicates(card, existingCards, SIMILARITY_THRESHOLD);
      return potentialDuplicates.length === 0;
    });

    const duplicatesCount = validCards.length - cardsToInsert.length;
    if (duplicatesCount > 0) {
      console.log(`  → Filtered out ${duplicatesCount} potential duplicates via fuzzy matching`);
      stats.skipped += duplicatesCount;
    }
  }

  // Handle image uploads if enabled
  if (UPLOAD_IMAGES_TO_STORAGE && cardsToInsert.length > 0) {
    console.log(`  Uploading images to Supabase Storage...`);
    let uploadCount = 0;
    
    for (const card of cardsToInsert) {
      if (card.image_url && !card.image_url.includes("supabase.co")) {
        // Only upload if image is not already in our storage
        try {
          const storageUrl = await uploadImageToStorage(card.image_url, card.slug, supabase);
          if (storageUrl) {
            card.image_url = storageUrl;
            uploadCount++;
            stats.imageUploads++;
          } else {
            stats.imageUploadErrors++;
          }
        } catch (error) {
          console.warn(`    ⚠ Error uploading image for "${card.name}": ${error.message}`);
          stats.imageUploadErrors++;
        }
      }
    }
    
    console.log(`  ✓ Uploaded ${uploadCount} images to storage`);
  }

  // Check for slug collisions
  const slugsToCheck = new Set(cardsToInsert.map(c => c.slug));
  for (const slug of slugsToCheck) {
    if (existingBySlug.has(slug)) {
      console.warn(`    ⚠ Slug collision detected: "${slug}"`);
      // Append hash to make unique
      const card = cardsToInsert.find(c => c.slug === slug);
      if (card) {
        const hash = crypto.createHash("md5").update(card.id).digest("hex").substring(0, 6);
        card.slug = `${card.slug}-${hash}`;
      }
    }
  }

  if (cardsToInsert.length === 0) {
    console.log(`  ⚠ No valid cards to insert after validation and deduplication`);
    return { inserted: 0, skipped: newCards.length };
  }

  console.log(`  → ${cardsToInsert.length} cards ready for insertion`);

  // Insert in chunks
  const chunkSize = 500;
  const totalChunks = Math.ceil(cardsToInsert.length / chunkSize);
  console.log(`  Inserting in ${totalChunks} chunk(s) of up to ${chunkSize} cards each...`);

  let insertedCount = 0;
  for (let i = 0; i < cardsToInsert.length; i += chunkSize) {
    const chunk = cardsToInsert.slice(i, i + chunkSize);
    const chunkNum = Math.floor(i / chunkSize) + 1;
    console.log(`    Inserting chunk ${chunkNum}/${totalChunks} (${chunk.length} cards)...`);

    const { error } = await supabase.from("cards").insert(chunk);

    if (error) {
      console.error(`    ✗ Error inserting chunk: ${error.message}`);
      throw new Error(`Failed to insert cards: ${error.message}`);
    }

    insertedCount += chunk.length;
    console.log(`    ✓ Chunk ${chunkNum} inserted successfully`);
    await sleep(100);
  }

  stats.inserted += insertedCount;
  stats.skipped += newCards.length - insertedCount;

  console.log(`  ✓ All ${insertedCount} new cards inserted successfully`);
  return { inserted: insertedCount, skipped: newCards.length - insertedCount };
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

  // Skip sets that already have cards
  console.log("Sprawdzanie które zestawy już mają karty...");
  const { data: existingCards } = await supabase.from("cards").select("set_name");

  const setsWithCards = new Set((existingCards || []).map((c) => c.set_name));
  const setsToProcess = sets.filter((set) => !setsWithCards.has(set.name));

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
      const cards = await fetchCardsForSet(set.name, set.id);
      if (!cards.length) {
        console.log(`  ⚠ No cards found for ${set.name}. Skipping.`);
        continue;
      }

      stats.total += cards.length;

      console.log(`  Deduplicating ${cards.length} cards from API...`);
      // Deduplicate cards from API
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

      console.log(`  Mapping and normalizing cards...`);
      const mapped = uniqueApiCards.map((card) => mapCardPayload(card, set));
      console.log(`  ✓ Mapped ${mapped.length} cards`);

      // Get existing cards for fuzzy matching
      const existingCards = await getExistingCards(set.name);

      if (mapped.length > 0) {
        const result = await upsertCards(mapped, set.name, existingCards);
        console.log(`\n✓ Successfully processed ${mapped.length} cards for ${set.name} (${cards.length} total from API).`);
        if (result.inserted > 0) {
          console.log(`  → Wstawiono ${result.inserted} nowych kart`);
        }
        if (result.skipped > 0) {
          console.log(`  → Pominięto ${result.skipped} kart (już istnieją lub są duplikatami)`);
        }
      } else {
        console.log(`\n⚠ No cards to import for ${set.name}`);
      }
    } catch (error) {
      console.error(`\n✗ Error during import of ${set.name}:`);
      console.error(`  Error: ${error.message}`);
      if (error.stack) {
        console.error(`  Stack: ${error.stack.split("\n").slice(0, 3).join("\n")}`);
      }
    }
  }

  // Print final statistics
  console.log("\n" + "=".repeat(60));
  console.log("=== Import Statistics ===");
  console.log(`Total cards processed: ${stats.total}`);
  console.log(`Inserted: ${stats.inserted}`);
  console.log(`Skipped: ${stats.skipped}`);
  console.log(`Validation errors: ${stats.validationErrors}`);
  console.log(`Duplicate detections (fuzzy matching): ${stats.duplicateDetections}`);
  if (UPLOAD_IMAGES_TO_STORAGE) {
    console.log(`Images uploaded: ${stats.imageUploads}`);
    console.log(`Image upload errors: ${stats.imageUploadErrors}`);
  }
  console.log("=".repeat(60));

  console.log("\nDone.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

