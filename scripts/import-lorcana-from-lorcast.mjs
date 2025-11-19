/**
 * Import Lorcana cards from Lorcast API (https://lorcast.com/docs/api/sets).
 * Fetch sets: GET https://api.lorcast.com/v0/sets
 * Fetch cards per set: GET https://api.lorcast.com/v0/sets/:id/cards (or :code)
 * Maps to public.cards (Slab Market schema).
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env.");
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const API_BASE = "https://api.lorcast.com/v0";
const CATEGORY = { id: "disney-lorcana", name: "Disney Lorcana", slug: "disney-lorcana" };

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      "Accept": "application/json",
      "User-Agent": "SM-Lorcana-Import-Lorcast/0.1",
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Request failed ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

function toId(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function mapCardFromLorcast(card) {
  // Lorcast model ref: https://lorcast.com/docs/api/sets
  // Important fields:
  // id (crd_xxx), name, version (subtitle), rarity, collector_number, image_uris.digital.normal
  // set: { name, code, id }, released_at
  const name = [card.name, card.version].filter(Boolean).join(" - "); // Keep subtitle in name for clarity
  const setName = card.set?.name || "";
  const cardNum = card.collector_number != null ? String(card.collector_number) : null;
  const rarity = card.rarity || null;
  const image =
    card.image_uris?.digital?.normal ||
    card.image_uris?.digital?.large ||
    null;
  const year = card.released_at ? parseInt(String(card.released_at).slice(0, 4)) : null;

  // Stable ID – prefer Lorcast card id
  const id = card.id ? `lorcast-${card.id}` : `lorcast-${toId(`${setName}-${cardNum || ""}-${name}`)}`;

  return {
    id,
    name,
    set_name: setName,
    card_number: cardNum,
    category_id: CATEGORY.id,
    rarity,
    description: card.flavor_text || null,
    image_url: image,
    year: Number.isFinite(year) ? year : null,
  };
}

async function ensureCategory() {
  const { error } = await supabase
    .from("categories")
    .upsert(
      {
        id: CATEGORY.id,
        name: CATEGORY.name,
        slug: CATEGORY.slug,
        enabled: true,
      },
      { onConflict: "id" }
    );
  if (error) throw error;
}

async function upsertCards(cards) {
  const chunkSize = 500;
  let total = 0;
  for (let i = 0; i < cards.length; i += chunkSize) {
    const chunk = cards.slice(i, i + chunkSize);
    const { error } = await supabase
      .from("cards")
      .upsert(chunk, { onConflict: "id", ignoreDuplicates: false });
    if (error) {
      console.error("Upsert error:", error.message);
      console.dir(chunk[0], { depth: 2 });
      throw error;
    }
    total += chunk.length;
    console.log(`  Upserted ${Math.min(total, cards.length)}/${cards.length}`);
  }
}

async function main() {
  console.log("=== Lorcana import from Lorcast ===");
  await ensureCategory();
  // 1) Fetch sets
  const setsResp = await fetchJson(`${API_BASE}/sets`);
  const sets = Array.isArray(setsResp?.results) ? setsResp.results : [];
  console.log(`Sets: ${sets.length}`);

  let all = [];
  for (const set of sets) {
    const setId = set.id || set.code;
    if (!setId) continue;
    console.log(`  Set: ${set.name} (${set.code || set.id})`);
    // 2) Fetch all cards for the set
    const cards = await fetchJson(`${API_BASE}/sets/${set.code || set.id}/cards`);
    const arr = Array.isArray(cards) ? cards : [];
    const mapped = arr.map(mapCardFromLorcast);
    console.log(`    cards: ${arr.length}, mapped: ${mapped.length}`);
    all.push(...mapped);
  }
  // Deduplicate by id
  const unique = Array.from(new Map(all.map((c) => [c.id, c])).values());
  console.log(`Total cards: ${all.length}, unique by id: ${unique.length}`);
  await upsertCards(unique);
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


