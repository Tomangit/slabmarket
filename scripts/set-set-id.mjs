#!/usr/bin/env node

import 'dotenv/config';
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const [language, name, newId] = process.argv.slice(2);
  if (!language || !name || !newId) {
    console.error("Usage: node scripts/set-set-id.mjs <language> <name> <newId>");
    process.exit(1);
  }

  const { data, error } = await supabase
    .from("sets")
    .update({ id: newId })
    .eq("language", language)
    .eq("name", name)
    .select("id, name, language");

  if (error) {
    console.error("Update error:", error.message);
    process.exit(1);
  }
  if (!data || data.length === 0) {
    console.log("No rows updated (check language/name).");
  } else {
    console.log("Updated:", data);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


