#!/usr/bin/env node

/**
 * Fix all sets.id in database using PokemonTCG API canonical IDs.
 * Strategy:
 * - Fetch all sets from PokemonTCG API (single canonical list with ids and english names)
 * - Build a normalized name key (lowercase, strip punctuation, trim spaces, remove variant suffixes:
 *   shadowless/unlimited/1st edition/first edition)
 * - For every row in public.sets (all languages), compute the same normalized key and update its id
 *   to the API id where keys match. If multiple DB rows map to same key (across languages), all get same id.
 * - This does NOT change names or languages; only fills correct id values.
 *
 * Notes:
 * - In case of collisions (two different API sets mapping to same normalized key), we disambiguate
 *   using release_year when both sides have it. Otherwise we skip the ambiguous mapping and log a warning.
 */

import 'dotenv/config';
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const API_BASE = "https://api.pokemontcg.io/v2";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function normalizeName(raw) {
  if (!raw) return "";
  const withoutVariant = raw.replace(/\s+(shadowless|unlimited|1st edition|first edition)$/i, "");
  return withoutVariant
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchAllApiSets() {
  const PAGE_SIZE = 250;
  const REQUEST_TIMEOUT = 120000; // 120s to be robust
  let page = 1;
  const apiSets = [];
  const cacheDir = path.join(process.cwd(), "cache");
  const cachePrefix = "sets-page";
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  while (true) {
    const cachePath = path.join(cacheDir, `${cachePrefix}-${page}.json`);
    let json;

    if (fs.existsSync(cachePath)) {
      json = JSON.parse(fs.readFileSync(cachePath, "utf8"));
    } else {
      const url = `${API_BASE}/sets?page=${page}&pageSize=${PAGE_SIZE}`;
      let response;
      // up to 5 attempts per page with exponential backoff
      for (let attempt = 1; attempt <= 5; attempt++) {
        try {
          const headers = { "User-Agent": "PokemonTCG-Set-Fixer/1.0" };
          if (process.env.POKEMON_TCG_API_KEY) {
            headers["X-Api-Key"] = process.env.POKEMON_TCG_API_KEY;
          }
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Request timeout after ${REQUEST_TIMEOUT}ms`)), REQUEST_TIMEOUT)
          );
          const fetchPromise = fetch(url, { headers });
          response = await Promise.race([fetchPromise, timeoutPromise]);
          if (response.ok) {
            break;
          }
          if (attempt === 5) {
            const body = await response.text();
            throw new Error(`PokemonTCG API error (${response.status}) after ${attempt} attempts: ${body.substring(0, 200)}`);
          }
        } catch (err) {
          if (attempt === 5) throw err;
          const backoffMs = 1000 * Math.pow(2, attempt - 1);
          await new Promise(r => setTimeout(r, backoffMs));
          continue;
        }
      }
      json = await response.json();
      fs.writeFileSync(cachePath, JSON.stringify(json), "utf8");
    }

    const batch = json.data ?? [];
    if (batch.length === 0) break;

    for (const s of batch) {
      apiSets.push({
        id: s.id, // canonical API id
        name: s.name,
        normalizedKey: normalizeName(s.name),
        release_year: s.releaseDate ? Number(s.releaseDate.slice(0, 4)) : null,
        series: s.series ?? null,
      });
    }

    if (batch.length < PAGE_SIZE) break;
    page++;
    await new Promise(r => setTimeout(r, 150));
  }
  return apiSets;
}

async function loadDbSets() {
  const { data, error } = await supabase
    .from("sets")
    .select("id, name, language, release_year");
  if (error) {
    throw new Error(`Failed to load DB sets: ${error.message}`);
  }
  return (data || []).map(s => ({
    ...s,
    normalizedKey: normalizeName(s.name),
  }));
}

async function updateIds(updates) {
  if (updates.length === 0) return;
  const chunkSize = 500;
  for (let i = 0; i < updates.length; i += chunkSize) {
    const chunk = updates.slice(i, i + chunkSize);
    const { error } = await supabase
      .from("sets")
      .upsert(chunk, { onConflict: "id" }); // upsert by id; but we're changing id, so better do targeted updates
    if (error) {
      throw new Error(`Upsert error: ${error.message}`);
    }
  }
}

async function targetedUpdateIds(updates) {
  // More precise: run update where language+name match to set new id
  for (const u of updates) {
    const { error } = await supabase
      .from("sets")
      .update({ id: u.new_id })
      .eq("language", u.language)
      .eq("name", u.name);
    if (error) {
      console.error(`Failed to update id for ${u.language} / ${u.name}: ${error.message}`);
    }
  }
}

async function main() {
  console.log("=== Fixing sets.id using PokemonTCG API ===");
  console.log("Loading API sets...");
  const apiSets = await fetchAllApiSets();
  console.log(`API sets loaded: ${apiSets.length}`);

  // Build map: normalizedKey -> array of api sets (for ambiguity resolution)
  const keyToApi = new Map();
  for (const s of apiSets) {
    if (!keyToApi.has(s.normalizedKey)) keyToApi.set(s.normalizedKey, []);
    keyToApi.get(s.normalizedKey).push(s);
  }

  console.log("Loading DB sets...");
  const dbSets = await loadDbSets();
  console.log(`DB sets loaded: ${dbSets.length}`);

  const updates = [];
  let matched = 0;
  let ambiguous = 0;
  let missing = 0;

  for (const db of dbSets) {
    const candidates = keyToApi.get(db.normalizedKey) || [];
    if (candidates.length === 0) {
      missing++;
      continue;
    }
    if (candidates.length === 1) {
      updates.push({ language: db.language, name: db.name, new_id: candidates[0].id });
      matched++;
      continue;
    }
    // Ambiguity: try resolve by release_year if present
    const byYear = db.release_year
      ? candidates.filter(c => c.release_year === db.release_year)
      : [];
    if (byYear.length === 1) {
      updates.push({ language: db.language, name: db.name, new_id: byYear[0].id });
      matched++;
    } else {
      ambiguous++;
      console.warn(`Ambiguous mapping for "${db.name}" [${db.language}], candidates: ${candidates.map(c => `${c.name}(${c.id})`).join(", ")}`);
    }
  }

  console.log(`Prepared updates: ${updates.length} (matched=${matched}, ambiguous=${ambiguous}, missing=${missing})`);
  console.log("Applying updates...");
  await targetedUpdateIds(updates);
  console.log("Done. You can rerun imports; queries will use set.id now.");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});


