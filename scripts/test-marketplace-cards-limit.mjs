import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing environment variables.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

console.log("Testowanie limitu zapytania do marketplace_cards...\n");

// Test 1: Pobierz bez limitu
const { data: allCards, count: totalCount, error } = await supabase
  .from("marketplace_cards")
  .select("*", { count: "exact" })
  .order("name");

if (error) {
  console.error("Błąd:", error.message);
  process.exit(1);
}

console.log(`Łączna liczba kart w widoku: ${totalCount || 0}`);
console.log(`Liczba kart zwróconych w data: ${allCards?.length || 0}`);

if (totalCount && allCards && totalCount > allCards.length) {
  console.log(`\n⚠ PROBLEM: Supabase zwraca tylko ${allCards.length} kart z ${totalCount}!`);
  console.log(`  To jest domyślny limit Supabase (1000 rekordów).`);
  console.log(`  Musimy użyć paginacji lub zwiększyć limit.`);
} else {
  console.log(`\n✓ Wszystkie karty są zwracane.`);
}

// Test 2: Zwiększony limit
console.log(`\nTest z limitem 10000...`);
const { data: cardsWithLimit, count: countWithLimit, error: error2 } = await supabase
  .from("marketplace_cards")
  .select("*", { count: "exact" })
  .order("name")
  .limit(10000);

if (!error2) {
  console.log(`  Zwrócono: ${cardsWithLimit?.length || 0} kart`);
  if (countWithLimit && cardsWithLimit && countWithLimit > cardsWithLimit.length) {
    console.log(`  ⚠ Nadal brakuje ${countWithLimit - cardsWithLimit.length} kart!`);
  } else {
    console.log(`  ✓ Wszystkie karty zwrócone z limitem 10000`);
  }
}

