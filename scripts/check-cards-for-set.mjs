import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing environment variables.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const setName = process.argv[2] || "151";

console.log(`Sprawdzanie kart dla zestawu: "${setName}"\n`);

// Sprawdź karty w tabeli cards
const { data: cards, error: cardsError } = await supabase
  .from("cards")
  .select("id, name, set_name, card_number")
  .eq("set_name", setName)
  .limit(10);

if (cardsError) {
  console.error("Błąd:", cardsError.message);
  process.exit(1);
}

console.log(`Karty w tabeli 'cards': ${cards?.length || 0}`);
if (cards && cards.length > 0) {
  console.log("Przykładowe karty:");
  cards.slice(0, 5).forEach((card, i) => {
    console.log(`  ${i + 1}. ${card.name} (${card.card_number || 'no number'})`);
  });
}

// Sprawdź w widoku marketplace_cards
const { data: marketplaceCards, error: marketplaceError } = await supabase
  .from("marketplace_cards")
  .select("id, name, set_name, total_listings")
  .eq("set_name", setName)
  .limit(10);

if (marketplaceError) {
  console.error("\nBłąd przy marketplace_cards:", marketplaceError.message);
} else {
  console.log(`\nKarty w widoku 'marketplace_cards': ${marketplaceCards?.length || 0}`);
  if (marketplaceCards && marketplaceCards.length > 0) {
    console.log("Przykładowe karty:");
    marketplaceCards.slice(0, 5).forEach((card, i) => {
      console.log(`  ${i + 1}. ${card.name} (listings: ${card.total_listings || 0})`);
    });
  } else {
    console.log("⚠ Brak kart w widoku marketplace_cards!");
    console.log("To może oznaczać, że widok nie jest zaktualizowany lub wymaga slabs.");
  }
}

// Sprawdź liczbę wszystkich kart dla tego zestawu
const { count: totalCount, error: countError } = await supabase
  .from("cards")
  .select("*", { count: "exact", head: true })
  .eq("set_name", setName);

if (!countError) {
  console.log(`\nŁączna liczba kart dla "${setName}": ${totalCount || 0}`);
}

