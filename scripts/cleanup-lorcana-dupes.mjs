/**
 * Cleanup duplicate Lorcana cards created by previous ID scheme.
 * Keeps the oldest record per (category_id, name, set_name, card_number).
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

async function fetchAllLorcanaCards() {
  const pageSize = 1000;
  let page = 0;
  const all = [];
  while (true) {
    const { data, error } = await supabase
      .from("cards")
      .select("id, name, set_name, card_number, created_at", { count: "exact" })
      .eq("category_id", "disney-lorcana")
      .order("created_at", { ascending: true })
      .range(page * pageSize, page * pageSize + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < pageSize) break;
    page += 1;
    if (page > 200) break;
  }
  return all;
}

function keyOf(r) {
  return `${r.name}||${r.set_name}||${r.card_number ?? ""}`;
}

async function deleteIds(ids) {
  if (ids.length === 0) return;
  const chunk = 500;
  for (let i = 0; i < ids.length; i += chunk) {
    const batch = ids.slice(i, i + chunk);
    const { error } = await supabase.from("cards").delete().in("id", batch);
    if (error) throw error;
    console.log(`  Deleted ${Math.min(i + chunk, ids.length)}/${ids.length}`);
  }
}

async function main() {
  console.log("=== Cleanup Lorcana duplicates ===");
  const all = await fetchAllLorcanaCards();
  console.log(`Fetched: ${all.length}`);

  const keep = new Map(); // key -> id
  const dupes = [];
  for (const row of all) {
    const k = keyOf(row);
    if (!keep.has(k)) keep.set(k, row.id);
    else dupes.push(row.id);
  }
  console.log(`To delete: ${dupes.length}`);
  await deleteIds(dupes);
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


