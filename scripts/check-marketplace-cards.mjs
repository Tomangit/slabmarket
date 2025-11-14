import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing environment variables.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

console.log("Sprawdzanie widoku marketplace_cards...\n");

// Sprawdź czy widok istnieje i jakie dane zwraca
try {
  // Próbuj pobrać wszystkie karty (bez filtra total_listings)
  const { data: allCards, error: allError } = await supabase
    .from("marketplace_cards")
    .select("*")
    .limit(5);

  if (allError) {
    console.error("Błąd przy pobieraniu z marketplace_cards:", allError.message);
    console.log("\nSprawdzam czy widok istnieje...");
    
    // Sprawdź bezpośrednio z tabeli cards
    const { data: cards, error: cardsError } = await supabase
      .from("cards")
      .select("id, name, set_name, total_listings")
      .limit(5);
    
    if (cardsError) {
      console.error("Błąd przy pobieraniu z cards:", cardsError.message);
    } else {
      console.log("Przykładowe karty z tabeli cards:");
      cards.forEach(card => {
        console.log(`  - ${card.name} (${card.set_name}) - total_listings: ${card.total_listings || 0}`);
      });
    }
  } else {
    console.log(`✓ Widok marketplace_cards istnieje`);
    console.log(`  Przykładowe karty (pierwsze 5):\n`);
    allCards.forEach((card, i) => {
      console.log(`${i + 1}. ${card.name} (${card.set_name})`);
      console.log(`   total_listings: ${card.total_listings || 0}`);
      console.log(`   lowest_price: ${card.lowest_price || 'N/A'}`);
      console.log();
    });
  }

  // Sprawdź ile kart ma total_listings > 0
  const { count: withListings, error: countError } = await supabase
    .from("marketplace_cards")
    .select("*", { count: "exact", head: true })
    .gt("total_listings", 0);

  if (!countError) {
    console.log(`\nKarty z total_listings > 0: ${withListings || 0}`);
  }

  // Sprawdź ile kart w ogóle
  const { count: totalCount, error: totalError } = await supabase
    .from("marketplace_cards")
    .select("*", { count: "exact", head: true });

  if (!totalError) {
    console.log(`Wszystkie karty w marketplace_cards: ${totalCount || 0}`);
    
    if (totalCount > 0 && (withListings || 0) === 0) {
      console.log(`\n⚠ PROBLEM: Wszystkie karty mają total_listings = 0!`);
      console.log(`  To dlatego nie są wyświetlane na stronie.`);
      console.log(`  Rozwiązanie: Usuń filtr .gt("total_listings", 0) lub dodaj slabs do kart.`);
    }
  }

  // Sprawdź czy są jakieś slabs w bazie
  const { count: slabsCount, error: slabsError } = await supabase
    .from("slabs")
    .select("*", { count: "exact", head: true });

  if (!slabsError) {
    console.log(`\nSlabs w bazie: ${slabsCount || 0}`);
    if (slabsCount === 0) {
      console.log(`  ⚠ Brak slabs - to dlatego total_listings = 0 dla wszystkich kart`);
    }
  }

} catch (error) {
  console.error("Błąd:", error.message);
}

