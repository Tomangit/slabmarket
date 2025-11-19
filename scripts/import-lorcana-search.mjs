/**
 * Lorcana full import using /search with pagination and ordering.
 * Goal: ensure we fetch all variants per set (beyond simple /cards/all).
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

const API_BASE = "https://api.lorcana-api.com";
const CATEGORY = { id: "disney-lorcana", name: "Disney Lorcana", slug: "disney-lorcana" };

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      "Accept": "application/json; charset=utf-8",
      "User-Agent": "SM-Lorcana-Import/0.4",
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

function mapCard(c) {
  const name = c?.Name || "";
  const setName = c?.Set_Name || "";
  const cardNum = c?.Card_Num != null ? String(c.Card_Num) : null;
  const rarity = c?.Rarity || null;
  const image = c?.Image || null;
  const year = typeof c?.Date_Added === "string" ? parseInt(c.Date_Added.slice(0, 4)) : null;

  // Unique id per variant (rarity/image tail included)
  const baseSlug = toId(`${setName}-${cardNum || ""}-${name}`);
  const raritySlug = rarity ? `-${toId(rarity)}` : "";
  const imageSlug = image ? `-${toId(image.split("/").pop() || "")}` : "";
  const id = `lorcana-${baseSlug}${raritySlug}${imageSlug}`;

  return {
    id,
    name,
    set_name: setName,
    card_number: cardNum,
    category_id: CATEGORY.id,
    rarity,
    description: c?.Flavor_Text || null,
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
    console.log(`  Upserted ${total}/${cards.length}`);
  }
}

async function getAllSetNamesFromAPI() {
  // Start from /cards/all to get baseline set list, then deduplicate
  const url = `${API_BASE}/cards/all`;
  const all = await fetchJson(url);
  const names = Array.from(new Set((all || []).map((c) => c.Set_Name).filter(Boolean)));
  return names.sort((a, b) => a.localeCompare(b));
}

async function fetchAllForSet(setName) {
  const pageSize = 1000; // big page to cover entire set
  let page = 1;
  const results = [];
  // Try multiple search syntaxes based on docs/community examples
  const searchTemplates = [
    (s) => `set="${s}"`,
    (s) => `Set_Name="${s}"`,
    (s) => `set-name="${s}"`,
  ];
  let templateIdx = 0;
  // try each template until we get non-zero results (or exhaust)
  while (templateIdx < searchTemplates.length) {
    const searchExpr = searchTemplates[templateIdx](setName);
    page = 1;
    results.length = 0;
    console.log(`    trying search: ${searchExpr}`);
    while (true) {
      const params = new URLSearchParams();
      params.set("search", searchExpr);
      params.set("pagesize", String(pageSize));
      params.set("page", String(page));
      params.set("orderby", "Card_Num");
      params.set("sortdirection", "asc");
      const url = `${API_BASE}/search?${params.toString()}`;
      const data = await fetchJson(url);
      const arr = Array.isArray(data) ? data : [];
      results.push(...arr);
      console.log(`      fetched page ${page}, count=${arr.length}`);
      if (arr.length < pageSize) break; // last page
      page += 1;
      if (page > 50) break; // hard stop safety
    }
    if (results.length > 0) break;
    templateIdx += 1;
  }
  return results;
}

async function fetchVariantsForSet(setName, rarity) {
  const pageSize = 1000;
  let page = 1;
  const out = [];
  while (true) {
    const params = new URLSearchParams();
    // Try common 'search' syntax (set + rarity); if backend ignores rarity it will still just return set cards
    params.set("search", `set="${setName}" AND rarity="${rarity}"`);
    params.set("pagesize", String(pageSize));
    params.set("page", String(page));
    params.set("orderby", "Card_Num");
    params.set("sortdirection", "asc");
    const url = `${API_BASE}/search?${params.toString()}`;
    const data = await fetchJson(url);
    const arr = Array.isArray(data) ? data : [];
    out.push(...arr);
    console.log(`      [${rarity}] fetched page ${page}, count=${arr.length}`);
    if (arr.length < pageSize) break;
    page += 1;
    if (page > 50) break; // hard stop safety
  }
  return out;
}

async function main() {
  console.log("=== Lorcana import (search with pagination) ===");
  await ensureCategory();
  const setNames = await getAllSetNamesFromAPI();
  console.log(`Sets detected: ${setNames.length}`);

  let allCards = [];
  for (const setName of setNames) {
    console.log(`  Set: ${setName}`);
    // Base
    const baseRaw = await fetchAllForSet(setName);
    const baseMapped = baseRaw.map(mapCard);
    console.log(`    base mapped: ${baseMapped.length}`);
    allCards.push(...baseMapped);
    // Variants (best-effort; if API nie zwróci, wynik będzie 0 i nie popsuje bazy)
    for (const rarity of ["Enchanted", "Iconic"]) {
      const varRaw = await fetchVariantsForSet(setName, rarity);
      if (varRaw.length > 0) {
        const varMapped = varRaw.map(mapCard);
        console.log(`    ${rarity} mapped: ${varMapped.length}`);
        allCards.push(...varMapped);
      } else {
        console.log(`    ${rarity} mapped: 0`);
      }
    }
  }
  // Deduplicate by id
  const unique = Array.from(new Map(allCards.map((c) => [c.id, c])).values());
  console.log(`Total cards mapped: ${allCards.length}, unique by id: ${unique.length}`);
  await upsertCards(unique);

  console.log("Done.");
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});


