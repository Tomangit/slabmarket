/**
 * Importer Lorcana (The First Chapter) -> public.cards
 * - Pobiera dane z api.lorcana-api.com
 * - Filtrowanie po Set_Name === 'The First Chapter'
 * - Mapuje do schematu `cards`
 * - Upsert do Supabase
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
const SET_NAME = "The First Chapter";
const CATEGORY = { id: "disney-lorcana", name: "Disney Lorcana", slug: "disney-lorcana" };

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      "Accept": "application/json; charset=utf-8",
      "User-Agent": "SM-Lorcana-Import/0.2",
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

  // Stabilny ID – jeden rekord na kartę (bez wariantów)
  const id = c?.Unique_ID
    ? `lorcana-${c.Unique_ID}`
    : `lorcana-${toId(`${setName}-${cardNum || ""}-${name}`)}`;

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
  const { data, error } = await supabase
    .from("categories")
    .upsert(
      {
        id: CATEGORY.id,
        name: CATEGORY.name,
        slug: CATEGORY.slug,
        enabled: true,
      },
      { onConflict: "id" }
    )
    .select()
    .single();
  if (error) {
    throw error;
  }
  return data;
}

async function upsertCards(cards) {
  const chunkSize = 500;
  let total = 0;
  for (let i = 0; i < cards.length; i += chunkSize) {
    const chunk = cards.slice(i, i + chunkSize);
    const { error, count } = await supabase
      .from("cards")
      .upsert(chunk, { onConflict: "id", ignoreDuplicates: false, count: "exact" });
    if (error) {
      console.error("Upsert error:", error.message);
      // show sample record for debugging
      console.dir(chunk[0], { depth: 2 });
      throw error;
    }
    total += chunk.length;
    console.log(`  Upserted ${total}/${cards.length}`);
  }
}

async function main() {
  console.log("=== Lorcana import -> Supabase (First Chapter) ===");
  await ensureCategory();
  console.log("Category ensured:", CATEGORY.id);

  // Use /cards/all to include base + special variants (enchanted, iconic, etc.)
  const url = `${API_BASE}/cards/all`;
  console.log("Fetching:", url);
  const all = await fetchJson(url);
  if (!Array.isArray(all)) throw new Error("Unexpected response from API");
  console.log(`Fetched ${all.length} total cards`);

  const filtered = all.filter((c) => (c?.Set_Name || "").toLowerCase() === SET_NAME.toLowerCase());
  console.log(`Filtered to set "${SET_NAME}": ${filtered.length} cards`);

  const mapped = filtered.map(mapCard).filter((c) => c.name && c.set_name);
  console.log(`Mapped ${mapped.length} cards. Example:`, mapped[0]);

  await upsertCards(mapped);
  console.log("Done.");
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});


