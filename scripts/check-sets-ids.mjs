import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing environment variables.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

console.log("Sprawdzanie ID zestawów w bazie...\n");

const { data, error } = await supabase
  .from("sets")
  .select("id, name, language")
  .order("name")
  .limit(10);

if (error) {
  console.error("Error:", error.message);
  process.exit(1);
}

console.log("Przykładowe zestawy (pierwsze 10):\n");
data.forEach((set, index) => {
  console.log(`${index + 1}. "${set.name}" (${set.language})`);
  console.log(`   ID: ${set.id}`);
  console.log(`   Typ ID: ${set.id.includes('-') ? 'Lokalny (slug)' : 'API (np. base1, swsh4)'}`);
  console.log();
});

// Sprawdź ile zestawów ma ID z API (krótkie ID jak base1, swsh4) vs lokalne (slugi)
const { data: allSets } = await supabase
  .from("sets")
  .select("id");

const apiStyleIds = allSets.filter(s => 
  /^[a-z0-9]+$/.test(s.id) && s.id.length < 20 && !s.id.includes('-')
).length;

const localStyleIds = allSets.length - apiStyleIds;

console.log(`\nPodsumowanie:`);
console.log(`  Łączna liczba zestawów: ${allSets.length}`);
console.log(`  ID w stylu API (np. base1, swsh4): ${apiStyleIds}`);
console.log(`  ID lokalne (slugi): ${localStyleIds}`);

if (apiStyleIds === 0) {
  console.log(`\n⚠ UWAGA: Żadne zestawy nie mają ID z API PokemonTCG!`);
  console.log(`  Aby importować karty, musisz najpierw zaimportować zestawy z API.`);
  console.log(`  Uruchom: npm run import:pokemon:sets`);
} else if (apiStyleIds < allSets.length) {
  console.log(`\n⚠ UWAGA: Niektóre zestawy mają lokalne ID zamiast ID z API.`);
  console.log(`  Rozważ ponowny import zestawów z API.`);
} else {
  console.log(`\n✓ Wszystkie zestawy mają ID z API PokemonTCG - gotowe do importu kart!`);
}

