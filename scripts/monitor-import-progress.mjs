import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing environment variables.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

console.log("Sprawdzanie postępu importu kart...\n");

// Pobierz liczbę kart w bazie
const { count: totalCards, error: countError } = await supabase
  .from("cards")
  .select("*", { count: "exact", head: true });

if (countError) {
  console.error("Błąd:", countError.message);
  process.exit(1);
}

// Pobierz zestawy z kartami
const { data: setsWithCards, error: setsError } = await supabase
  .from("cards")
  .select("set_name")
  .order("set_name");

if (setsError) {
  console.error("Błąd:", setsError.message);
  process.exit(1);
}

const uniqueSets = new Set((setsWithCards || []).map(c => c.set_name));
const setsCount = uniqueSets.size;

// Pobierz wszystkie zestawy angielskie
const { count: totalEnglishSets, error: totalSetsError } = await supabase
  .from("sets")
  .select("*", { count: "exact", head: true })
  .eq("language", "english");

if (totalSetsError) {
  console.error("Błąd:", totalSetsError.message);
  process.exit(1);
}

console.log("📊 Statystyki importu:");
console.log(`  Łączna liczba kart: ${totalCards || 0}`);
console.log(`  Zestawy z kartami: ${setsCount}`);
console.log(`  Wszystkie zestawy angielskie: ${totalEnglishSets || 0}`);
console.log(`  Postęp: ${Math.round((setsCount / (totalEnglishSets || 1)) * 100)}%\n`);

// Pokaż ostatnio dodane zestawy
const { data: recentCards, error: recentError } = await supabase
  .from("cards")
  .select("set_name, created_at")
  .order("created_at", { ascending: false })
  .limit(100);

if (!recentError && recentCards) {
  const recentSets = new Map();
  recentCards.forEach(card => {
    if (!recentSets.has(card.set_name)) {
      recentSets.set(card.set_name, card.created_at);
    }
  });
  
  const sortedRecent = Array.from(recentSets.entries())
    .sort((a, b) => new Date(b[1]) - new Date(a[1]))
    .slice(0, 10);
  
  if (sortedRecent.length > 0) {
    console.log("📝 Ostatnio zaimportowane zestawy (ostatnie 10):");
    sortedRecent.forEach(([setName, date], index) => {
      const timeAgo = new Date() - new Date(date);
      const minutesAgo = Math.floor(timeAgo / 60000);
      const hoursAgo = Math.floor(minutesAgo / 60);
      const timeStr = hoursAgo > 0 
        ? `${hoursAgo}h temu` 
        : minutesAgo > 0 
        ? `${minutesAgo}min temu` 
        : "przed chwilą";
      
      console.log(`  ${(index + 1).toString().padStart(2)}. ${setName.padEnd(50)} (${timeStr})`);
    });
  }
}

console.log("\n💡 Aby zobaczyć pełne logi importu, uruchom:");
console.log("   node scripts/import-pokemon-cards.mjs --language english 2>&1 | tee import.log");

