import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing environment variables.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

console.log("Szczegółowa analiza kart w bazie...\n");

// Sprawdź wszystkie karty
const { data: allCards, error } = await supabase
  .from("cards")
  .select("id, name, set_name, created_at")
  .order("created_at", { ascending: false })
  .limit(20);

if (error) {
  console.error("Błąd:", error.message);
  process.exit(1);
}

console.log(`Ostatnie 20 kart w bazie:\n`);
allCards.forEach((card, i) => {
  const date = new Date(card.created_at).toLocaleString('pl-PL');
  console.log(`${(i + 1).toString().padStart(2)}. ${card.name.padEnd(40)} | ${card.set_name.padEnd(30)} | ${date}`);
});

// Sprawdź unikalne zestawy
const { data: setsData } = await supabase
  .from("cards")
  .select("set_name");

const uniqueSets = new Set((setsData || []).map(c => c.set_name));
console.log(`\nZestawy z kartami (${uniqueSets.size}):`);
Array.from(uniqueSets).sort().forEach((setName, i) => {
  console.log(`  ${(i + 1).toString().padStart(3)}. ${setName}`);
});

// Sprawdź marketplace_cards
const { count: marketplaceCount } = await supabase
  .from("marketplace_cards")
  .select("*", { count: "exact", head: true });

console.log(`\nKarty w widoku marketplace_cards: ${marketplaceCount || 0}`);

if (marketplaceCount === 0 && allCards.length > 0) {
  console.log(`\n⚠ PROBLEM: Są karty w tabeli 'cards', ale brak w widoku 'marketplace_cards'!`);
  console.log(`  To może oznaczać, że widok wymaga slabs/listings.`);
  console.log(`  Sprawdź definicję widoku marketplace_cards w bazie.`);
}

