import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

console.log("Checking set names in database vs API...\n");

// Get first few sets from DB
const { data: dbSets } = await supabase
  .from("sets")
  .select("name, id")
  .order("name")
  .limit(10);

console.log("First 10 sets in database:");
dbSets?.forEach((s) => console.log(`  - "${s.name}" (id: ${s.id})`));

// Check if "Base" exists
const { data: baseSets } = await supabase
  .from("sets")
  .select("name, id")
  .ilike("name", "%Base%")
  .limit(10);

console.log("\nSets with 'Base' in name:");
baseSets?.forEach((s) => console.log(`  - "${s.name}" (id: ${s.id})`));


