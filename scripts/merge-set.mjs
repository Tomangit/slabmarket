#!/usr/bin/env node
import 'dotenv/config';
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const [keepId, newName, language, deleteId] = process.argv.slice(2);
  if (!keepId || !newName || !language || !deleteId) {
    console.log("Usage: node scripts/merge-set.mjs <keepId> <newName> <language> <deleteId>");
    process.exit(1);
  }
  // Update name of canonical row
  let { error } = await supabase
    .from("sets")
    .update({ name: newName })
    .eq("id", keepId)
    .eq("language", language);
  if (error) {
    console.error("Update canonical error:", error.message);
    process.exit(1);
  }
  // Delete the duplicate row
  ({ error } = await supabase
    .from("sets")
    .delete()
    .eq("id", deleteId)
    .eq("language", language));
  if (error) {
    console.error("Delete duplicate error:", error.message);
    process.exit(1);
  }
  console.log("Merged. Canonical:", keepId, "named", newName, "Deleted:", deleteId);
}

main().catch(e => { console.error(e); process.exit(1); });


