import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing environment variables.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

console.log("Sprawdzanie zestawów angielskich bez kart...\n");

// Pobierz wszystkie zestawy angielskie
const { data: allSets, error: setsError } = await supabase
  .from("sets")
  .select("id, name, language")
  .eq("language", "english")
  .order("name");

if (setsError) {
  console.error("Błąd przy pobieraniu zestawów:", setsError.message);
  process.exit(1);
}

// Pobierz wszystkie unikalne set_name z kart
const { data: setsWithCards, error: cardsError } = await supabase
  .from("cards")
  .select("set_name")
  .order("set_name");

if (cardsError) {
  console.error("Błąd przy pobieraniu kart:", cardsError.message);
  process.exit(1);
}

const setsWithCardsSet = new Set((setsWithCards || []).map(c => c.set_name));

// Znajdź zestawy bez kart
const setsWithoutCards = (allSets || []).filter(set => !setsWithCardsSet.has(set.name));

console.log(`Znaleziono ${allSets.length} zestawów angielskich`);
console.log(`Zestawy z kartami: ${setsWithCardsSet.size}`);
console.log(`Zestawy bez kart: ${setsWithoutCards.length}\n`);

if (setsWithoutCards.length > 0) {
  console.log("Zestawy angielskie bez kart (pierwsze 20):\n");
  setsWithoutCards.slice(0, 20).forEach((set, index) => {
    console.log(`${(index + 1).toString().padStart(3)}. ${set.name.padEnd(50)} (ID: ${set.id})`);
  });
  
  if (setsWithoutCards.length > 20) {
    console.log(`\n... i ${setsWithoutCards.length - 20} więcej zestawów`);
  }
  
  console.log(`\n✓ Gotowe do importu: ${setsWithoutCards.length} zestawów`);
} else {
  console.log("✓ Wszystkie zestawy angielskie mają już karty!");
}

