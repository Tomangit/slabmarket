#!/usr/bin/env node

/**
 * Analizuje sety bez kart i kategoryzuje je
 */
import 'dotenv/config';
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log("=== Analiza setów bez kart ===\n");

  // Pobierz wszystkie sety
  const { data: sets, error: setsError } = await supabase
    .from("sets")
    .select("id, name, language, era")
    .order("name");

  if (setsError) {
    console.error("Błąd:", setsError.message);
    process.exit(1);
  }

  const categories = {
    trainerGallery: [],
    promos: [],
    scarletViolet: [],
    special: [],
    other: [],
  };

  for (const set of sets || []) {
    const { data: cards } = await supabase
      .from("cards")
      .select("id", { count: "exact", head: true })
      .eq("set_name", set.name);

    if ((cards?.length || 0) === 0) {
      const name = set.name.toLowerCase();
      
      if (name.includes("trainer gallery") || name.includes("galarian gallery")) {
        categories.trainerGallery.push(set);
      } else if (name.includes("promo") || name.includes("mcdonald") || name.includes("black star")) {
        categories.promos.push(set);
      } else if (set.era === "Scarlet & Violet" || name.includes("scarlet") || name.includes("violet")) {
        categories.scarletViolet.push(set);
      } else if (name.includes("trainer kit") || name.includes("energies") || name.includes("collection")) {
        categories.special.push(set);
      } else {
        categories.other.push(set);
      }
    }
  }

  console.log("📊 KATEGORYZACJA SETÓW BEZ KART:\n");

  console.log(`1. Trainer Gallery / Galarian Gallery (${categories.trainerGallery.length}):`);
  console.log("   ℹ️  Te sety to subsety - karty są w głównych setach");
  categories.trainerGallery.forEach(s => console.log(`   - ${s.name}`));
  console.log();

  console.log(`2. Promocje (${categories.promos.length}):`);
  console.log("   ℹ️  Promocje mogą wymagać osobnego importu");
  categories.promos.forEach(s => console.log(`   - ${s.name}`));
  console.log();

  console.log(`3. Scarlet & Violet Era (${categories.scarletViolet.length}):`);
  console.log("   ⚠️  Nowe sety - prawdopodobnie wymagają importu");
  categories.scarletViolet.forEach(s => console.log(`   - ${s.name} [${s.id}]`));
  console.log();

  console.log(`4. Specjalne (Trainer Kits, Energies, Collections) (${categories.special.length}):`);
  console.log("   ℹ️  Specjalne sety - mogą nie mieć standardowych kart");
  categories.special.forEach(s => console.log(`   - ${s.name}`));
  console.log();

  console.log(`5. Inne (${categories.other.length}):`);
  console.log("   ⚠️  Wymagają sprawdzenia");
  categories.other.forEach(s => console.log(`   - ${s.name} [${s.id}]`));
  console.log();

  // Podsumowanie
  const needsImport = categories.scarletViolet.length + categories.other.length;
  console.log("=== PODSUMOWANIE ===");
  console.log(`✅ Sety które prawdopodobnie NIE wymagają importu: ${categories.trainerGallery.length + categories.promos.length + categories.special.length}`);
  console.log(`⚠️  Sety które mogą wymagać importu: ${needsImport}`);
  
  if (needsImport > 0) {
    console.log("\n💡 Rekomendacja:");
    console.log("   Uruchom import dla setów Scarlet & Violet i 'Inne':");
    console.log("   node scripts/import-pokemon-cards.mjs --language english");
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});



