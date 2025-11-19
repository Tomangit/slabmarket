#!/usr/bin/env node

import 'dotenv/config';
import { createClient } from "@supabase/supabase-js";
import { setTimeout as sleep } from "node:timers/promises";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const API_BASE = "https://api.pokemontcg.io/v2";
const PAGE_SIZE = 250;

async function fetchSetsFromAPI(language) {
  let page = 1;
  const sets = [];
  const REQUEST_TIMEOUT = 60000; // 60 seconds timeout - powinno wystarczyć dla sets

  while (true) {
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
    if (language) {
      params.append("q", `series:${language}`);
    }

    const url = `${API_BASE}/sets?${params.toString()}`;
    let response;
    
    // Retry logic with timeout
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        if (attempt > 1) {
          console.log(`  Retry attempt ${attempt}/3 for page ${page}...`);
          await sleep(1000 * attempt);
        }
        
        // Build headers - zgodnie z dokumentacją API
        const headers = {
          "User-Agent": "PokemonTCG-Import-Script/1.0",
        };
        if (process.env.POKEMON_TCG_API_KEY) {
          headers["X-Api-Key"] = process.env.POKEMON_TCG_API_KEY;
        }
        
        // Użyj Promise.race dla timeoutu zamiast AbortController
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Request timeout after ${REQUEST_TIMEOUT}ms`));
          }, REQUEST_TIMEOUT);
        });
        
        const fetchPromise = fetch(url, {
          headers,
        });
        
        response = await Promise.race([fetchPromise, timeoutPromise]);
        
        if (response.ok) {
          break;
        }
        
        if (attempt === 3) {
          const body = await response.text();
          throw new Error(`PokemonTCG API error (${response.status}) after ${attempt} attempts: ${body.substring(0, 200)}`);
        }
      } catch (error) {
        if (error.message.includes('timeout') || error.message.includes('Timeout')) {
          if (attempt === 3) {
            throw new Error(`Request timeout after ${REQUEST_TIMEOUT}ms`);
          }
        } else if (attempt === 3) {
          throw error;
        }
      }
    }

    if (!response || !response.ok) {
      const body = await response.text();
      throw new Error(`PokemonTCG API error (${response.status}): ${body.substring(0, 200)}`);
    }

    const json = await response.json();
    const batch = json.data ?? [];
    if (batch.length === 0) {
      break;
    }

    sets.push(
      ...batch.map((set) => ({
        id: set.id,
        name: set.name,
        era: set.series ?? "Unknown",
        // Use provided language parameter, or default to 'english'
        // Note: Pokemon TCG API may not always return language in set data,
        // so we rely on the language parameter passed to the function
        language: language || 'english',
        release_year: set.releaseDate ? Number(set.releaseDate.slice(0, 4)) : null,
      })),
    );

    if (batch.length < PAGE_SIZE) {
      break;
    }

    page += 1;
    await sleep(200);
  }

  return sets;
}

async function main() {
  const args = process.argv.slice(2);
  const languageArgIndex = args.indexOf("--language");
  const language = languageArgIndex !== -1 ? args[languageArgIndex + 1] : undefined;

  const apiSets = await fetchSetsFromAPI(language);

  const chunkSize = 500;
  for (let i = 0; i < apiSets.length; i += chunkSize) {
    const chunk = apiSets.slice(i, i + chunkSize);
    const { error } = await supabase.from("sets").upsert(chunk, { onConflict: "id" });
    if (error) {
      console.error("Failed to upsert sets", error.message);
      process.exit(1);
    }
  }

  console.log(`Upserted ${apiSets.length} sets.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
