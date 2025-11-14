import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing environment variables.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

console.log("Sprawdzanie zestawów z małą liczbą kart (możliwe niekompletne)...\n");

// Pobierz wszystkie zestawy angielskie
const { data: allSets } = await supabase
  .from("sets")
  .select("id, name, language")
  .eq("language", "english")
  .order("name");

// Policz karty per zestaw
const { data: allCards } = await supabase
  .from("cards")
  .select("set_name");

const cardsPerSet = new Map();
(allCards || []).forEach(card => {
  const count = cardsPerSet.get(card.set_name) || 0;
  cardsPerSet.set(card.set_name, count + 1);
});

// Znajdź zestawy z małą liczbą kart (prawdopodobnie niekompletne)
const incompleteSets = [];
allSets.forEach(set => {
  const cardCount = cardsPerSet.get(set.name) || 0;
  // Jeśli zestaw ma mniej niż 10 kart, może być niekompletny
  if (cardCount > 0 && cardCount < 10) {
    incompleteSets.push({ name: set.name, id: set.id, cards: cardCount });
  }
});

if (incompleteSets.length > 0) {
  console.log(`Znaleziono ${incompleteSets.length} zestawów z małą liczbą kart:\n`);
  incompleteSets.sort((a, b) => a.cards - b.cards).forEach((set, i) => {
    console.log(`${(i + 1).toString().padStart(3)}. ${set.name.padEnd(50)} ${set.cards.toString().padStart(3)} kart (ID: ${set.id})`);
  });
  console.log(`\n⚠ Te zestawy mogą być niekompletne z powodu timeoutów API.`);
  console.log(`  Możesz je ponownie zaimportować używając: --set "Nazwa Zestawu"`);
} else {
  console.log("✓ Nie znaleziono zestawów z podejrzanie małą liczbą kart.");
}

// Pokaż zestawy bez kart
const setsWithoutCards = allSets.filter(set => !cardsPerSet.has(set.name));
console.log(`\nZestawy bez kart: ${setsWithoutCards.length}`);
if (setsWithoutCards.length > 0 && setsWithoutCards.length <= 20) {
  console.log("Pierwsze zestawy bez kart:");
  setsWithoutCards.slice(0, 10).forEach((set, i) => {
    console.log(`  ${(i + 1).toString().padStart(2)}. ${set.name} (ID: ${set.id})`);
  });
}

