#!/usr/bin/env node
import 'dotenv/config';
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const [setName, categoryId] = process.argv.slice(2);
  if (!setName) {
    console.error("Usage: node scripts/set-cards-category.mjs <setName> [categoryId]");
    process.exit(1);
  }
  const cid = categoryId || 'pokemon-tcg';
  const { error, count } = await supabase
    .from("cards")
    .update({ category_id: cid })
    .eq("set_name", setName)
    .select("*", { count: "exact", head: true });
  if (error) {
    console.error("Update error:", error.message);
    process.exit(1);
  }
  console.log(`Updated category_id='${cid}' for ${count || 0} cards in set "${setName}"`);
}

main().catch(e => { console.error(e); process.exit(1); });


