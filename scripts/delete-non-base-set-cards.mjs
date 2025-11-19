#!/usr/bin/env node
import 'dotenv/config';
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Zestawy, które zostawiamy (wszystkie warianty nazw Base Set, które już mamy)
const BASE_SET_FAMILY = new Set(["Base Set", "Set de Base", "Grundset"]);

async function main() {
  const args = process.argv.slice(2);
  const confirm = args.includes("--confirm");

  // Znajdź karty poza Base Set
  const { data: cards, error } = await supabase
    .from("cards")
    .select("id, set_name")
    .not("set_name", "in", `(${Array.from(BASE_SET_FAMILY).map(s => `'${s.replace(/'/g,"''")}'`).join(",")})`);
  if (error) {
    console.error("Error fetching cards:", error.message);
    process.exit(1);
  }

  const cardIds = (cards || []).map(c => c.id);
  console.log(`Found ${cardIds.length} cards to delete (non-Base-Set).`);

  // Policz powiązane slabs
  let slabCount = null;
  try {
    const resp = await supabase
      .from("slabs")
      .select("*", { count: "exact", head: true })
      .in("card_id", cardIds);
    slabCount = resp.count ?? null;
  } catch (e) {
    console.warn("Warning: could not count slabs, proceeding with deletion.");
  }
  if (slabCount != null) console.log(`Related slabs to delete: ${slabCount}`);

  if (!confirm) {
    console.log("Dry-run only. Pass --confirm to execute deletion.");
    return;
  }

  // Usuń slabs najpierw
  if (cardIds.length > 0) {
    const { error: delSlabsErr } = await supabase
      .from("slabs")
      .delete()
      .in("card_id", cardIds);
    if (delSlabsErr) {
      console.error("Error deleting slabs:", delSlabsErr.message);
      process.exit(1);
    }
    console.log("Slabs deleted.");
  }

  // Usuń karty
  if (cardIds.length > 0) {
    const { error: delCardsErr } = await supabase
      .from("cards")
      .delete()
      .in("id", cardIds);
    if (delCardsErr) {
      console.error("Error deleting cards:", delCardsErr.message);
      process.exit(1);
    }
    console.log("Cards deleted.");
  }

  console.log("Cleanup completed.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


