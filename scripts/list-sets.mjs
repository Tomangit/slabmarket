import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing environment variables.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const { data, error } = await supabase
  .from("sets")
  .select("name, language")
  .order("name");

if (error) {
  console.error("Error:", error.message);
  process.exit(1);
}

console.log(`Found ${data.length} sets:\n`);
data.forEach((set, index) => {
  console.log(`${index + 1}. ${set.name} (${set.language})`);
});



