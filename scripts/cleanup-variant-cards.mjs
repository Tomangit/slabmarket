#!/usr/bin/env node
import 'dotenv/config';
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const variants = [
    { from: "Base Set Shadowless", to: "Base Set" },
    { from: "Base Set Unlimited", to: "Base Set" },
  ];
  let totalDeleted = 0;
  for (const v of variants) {
    const { error, count } = await supabase
      .from("cards")
      .delete({ count: "exact" })
      .eq("set_name", v.from);
    if (error) {
      console.error(`Error deleting variant cards for ${v.from}:`, error.message);
      process.exit(1);
    }
    console.log(`Deleted ${count || 0} cards for variant "${v.from}"`);
    totalDeleted += count || 0;
  }
  console.log(`Total deleted variant cards: ${totalDeleted}`);
  console.log("Done. Dropdown should no longer show variant set names.");
}

main().catch(e => { console.error(e); process.exit(1); });


