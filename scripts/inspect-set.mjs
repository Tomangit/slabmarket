#!/usr/bin/env node
import 'dotenv/config';
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const [key, value] = process.argv.slice(2);
  if (!key || !value) {
    console.log("Usage: node scripts/inspect-set.mjs <field> <value>");
    console.log("Fields: id | name | language");
    process.exit(1);
  }
  const { data, error } = await supabase
    .from("sets")
    .select("id, name, language, release_year")
    .eq(key, value);
  if (error) {
    console.error(error.message);
    process.exit(1);
  }
  console.log(JSON.stringify(data, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });


