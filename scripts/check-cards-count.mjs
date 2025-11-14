import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing environment variables.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

console.log("Sprawdzanie kart w bazie danych...\n");

// Pobierz całkowitą liczbę kart
const { count, error: countError } = await supabase
  .from("cards")
  .select("*", { count: "exact", head: true });

if (countError) {
  console.error("Błąd podczas liczenia kart:", countError.message);
  process.exit(1);
}

console.log(`✓ Łączna liczba kart w bazie: ${count || 0}\n`);

// Sprawdź statystyki per zestaw
const { data: setsStats, error: statsError } = await supabase
  .from("cards")
  .select("set_name")
  .order("set_name");

if (statsError) {
  console.error("Błąd podczas pobierania statystyk:", statsError.message);
  process.exit(1);
}

if (setsStats && setsStats.length > 0) {
  // Policz karty per zestaw
  const setsMap = new Map();
  setsStats.forEach(card => {
    const setName = card.set_name || "Unknown";
    setsMap.set(setName, (setsMap.get(setName) || 0) + 1);
  });

  console.log(`Karty pogrupowane według zestawów (${setsMap.size} zestawów):\n`);
  
  // Sortuj według liczby kart (malejąco)
  const sortedSets = Array.from(setsMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20); // Pokaż top 20

  sortedSets.forEach(([setName, count], index) => {
    console.log(`${(index + 1).toString().padStart(2)}. ${setName.padEnd(50)} ${count.toString().padStart(5)} kart`);
  });

  if (setsMap.size > 20) {
    console.log(`\n... i ${setsMap.size - 20} więcej zestawów`);
  }

  // Statystyki
  const totalCards = Array.from(setsMap.values()).reduce((sum, count) => sum + count, 0);
  const avgCardsPerSet = Math.round(totalCards / setsMap.size);
  const maxCards = Math.max(...Array.from(setsMap.values()));
  const minCards = Math.min(...Array.from(setsMap.values()));

  console.log(`\nStatystyki:`);
  console.log(`  Średnia liczba kart na zestaw: ${avgCardsPerSet}`);
  console.log(`  Najwięcej kart w zestawie: ${maxCards}`);
  console.log(`  Najmniej kart w zestawie: ${minCards}`);
} else {
  console.log("⚠ Brak kart w bazie danych.");
  console.log("Uruchom import kart: npm run import:pokemon");
}

