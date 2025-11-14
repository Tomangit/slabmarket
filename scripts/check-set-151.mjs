import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing environment variables.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

console.log("Sprawdzanie setu '151' i jego kart...\n");

// Sprawdź set
const { data: setData, error: setError } = await supabase
  .from("sets")
  .select("id, name, era, language, release_year")
  .eq("name", "151")
  .limit(1);

if (setError) {
  console.error("Błąd przy pobieraniu setu:", setError.message);
  process.exit(1);
}

if (!setData || setData.length === 0) {
  console.log("Set '151' nie został znaleziony w bazie.");
  process.exit(0);
}

const set = setData[0];
console.log(`✓ Set znaleziony: ${set.name} (ID: ${set.id}, Era: ${set.era}, Language: ${set.language})`);

// Sprawdź karty
const { data: cards, error: cardsError } = await supabase
  .from("cards")
  .select("id, name, set_name, card_number")
  .eq("set_name", "151")
  .limit(10);

if (cardsError) {
  console.error("Błąd przy pobieraniu kart:", cardsError.message);
  process.exit(1);
}

console.log(`\nKarty z set_name = "151": ${cards?.length || 0}`);
if (cards && cards.length > 0) {
  console.log("\nPrzykładowe karty:");
  cards.slice(0, 10).forEach((card, i) => {
    console.log(`  ${i + 1}. ${card.name} #${card.card_number || 'N/A'}`);
  });
} else {
  console.log("\n⚠ Brak kart z set_name = '151' w bazie!");
  console.log("  Karty nie zostały zaimportowane lub zostały zaimportowane pod inną nazwą setu.");
}

// Sprawdź marketplace_cards
const { data: marketplaceCards, error: marketplaceError } = await supabase
  .from("marketplace_cards")
  .select("id, name, set_name")
  .eq("set_name", "151")
  .limit(5);

if (!marketplaceError && marketplaceCards) {
  console.log(`\nKarty w widoku marketplace_cards: ${marketplaceCards.length}`);
  if (marketplaceCards.length > 0) {
    console.log("Przykładowe karty z marketplace_cards:");
    marketplaceCards.forEach((card, i) => {
      console.log(`  ${i + 1}. ${card.name}`);
    });
  }
}

