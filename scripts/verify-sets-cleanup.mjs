#!/usr/bin/env node

/**
 * Weryfikacja wyników migracji naprawy duplikatów setów
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
  console.log("=== Weryfikacja wyników migracji naprawy duplikatów setów ===\n");

  // 1. Sprawdź czy są jeszcze duplikaty
  console.log("1. Sprawdzanie duplikatów setów...");
  const { data: duplicates, error: dupError } = await supabase.rpc('exec_sql', {
    query: `
      SELECT name, language, COUNT(*) as cnt
      FROM public.sets
      GROUP BY name, language
      HAVING COUNT(*) > 1
      ORDER BY cnt DESC, name;
    `
  });

  // Alternatywnie użyjmy bezpośredniego zapytania
  const { data: allSets, error: setsError } = await supabase
    .from("sets")
    .select("id, name, language");

  if (setsError) {
    console.error("Błąd podczas pobierania setów:", setsError.message);
    process.exit(1);
  }

  // Grupuj po name + language
  const groups = new Map();
  for (const set of allSets || []) {
    const key = `${set.name}||${set.language}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(set);
  }

  const duplicatesFound = Array.from(groups.entries())
    .filter(([_, sets]) => sets.length > 1)
    .map(([key, sets]) => ({ key, sets }));

  if (duplicatesFound.length > 0) {
    console.log(`  ⚠️  Znaleziono ${duplicatesFound.length} grup duplikatów:`);
    for (const { key, sets } of duplicatesFound.slice(0, 10)) {
      const [name, language] = key.split("||");
      console.log(`    - "${name}" (${language}): ${sets.length} wersji`);
      sets.forEach(s => console.log(`      • ${s.id}`));
    }
    if (duplicatesFound.length > 10) {
      console.log(`    ... i ${duplicatesFound.length - 10} więcej`);
    }
  } else {
    console.log("  ✅ Brak duplikatów - wszystkie sety są unikalne");
  }

  // 2. Sprawdź sety z uszkodzonymi ID
  console.log("\n2. Sprawdzanie setów z uszkodzonymi ID...");
  const brokenIds = (allSets || []).filter(s => 
    s.id.includes('--') || 
    !/^[a-z0-9]+$/.test(s.id) || 
    s.id.length > 50
  );

  if (brokenIds.length > 0) {
    console.log(`  ⚠️  Znaleziono ${brokenIds.length} setów z uszkodzonymi ID:`);
    brokenIds.slice(0, 10).forEach(s => {
      console.log(`    - ${s.id} → "${s.name}" (${s.language})`);
    });
    if (brokenIds.length > 10) {
      console.log(`    ... i ${brokenIds.length - 10} więcej`);
    }
  } else {
    console.log("  ✅ Wszystkie ID setów są poprawne");
  }

  // 3. Sprawdź statystyki setów
  console.log("\n3. Statystyki setów:");
  const totalSets = allSets?.length || 0;
  const englishSets = (allSets || []).filter(s => s.language === 'english').length;
  const japaneseSets = (allSets || []).filter(s => s.language === 'japanese').length;
  const otherLanguages = totalSets - englishSets - japaneseSets;

  console.log(`  - Łącznie: ${totalSets} setów`);
  console.log(`  - English: ${englishSets}`);
  console.log(`  - Japanese: ${japaneseSets}`);
  if (otherLanguages > 0) {
    console.log(`  - Inne języki: ${otherLanguages}`);
  }

  // 4. Sprawdź sety z poprawnymi PokemonTCG API ID
  console.log("\n4. Sprawdzanie formatu ID setów...");
  const validIds = (allSets || []).filter(s => 
    /^[a-z0-9]+$/.test(s.id) && s.id.length <= 50
  );
  const invalidIds = totalSets - validIds.length;

  console.log(`  - Poprawne ID (PokemonTCG API format): ${validIds.length}`);
  console.log(`  - Niepoprawne ID: ${invalidIds}`);

  // 5. Sprawdź problematyczne sety SWSH
  console.log("\n5. Sprawdzanie problematycznych setów SWSH...");
  const swshSets = ['Astral Radiance', 'Brilliant Stars', 'Lost Origin', 'Silver Tempest'];
  
  for (const setName of swshSets) {
    const { data: cards, error: cardsError } = await supabase
      .from("cards")
      .select("card_number")
      .eq("set_name", setName);

    if (cardsError) {
      console.log(`  ⚠️  Błąd dla "${setName}": ${cardsError.message}`);
      continue;
    }

    const cardNumbers = (cards || [])
      .map(c => {
        const num = c.card_number?.replace(/[^0-9]/g, '');
        return num ? parseInt(num, 10) : null;
      })
      .filter(n => n !== null);

    const cnt_1_30 = cardNumbers.filter(n => n >= 1 && n <= 30).length;
    const cnt_31_99 = cardNumbers.filter(n => n >= 31 && n <= 99).length;
    const total = cardNumbers.length;

    console.log(`  - "${setName}":`);
    console.log(`    • Łącznie kart: ${total}`);
    console.log(`    • Karty 1-30: ${cnt_1_30}`);
    console.log(`    • Karty 31-99: ${cnt_31_99} ${cnt_31_99 === 0 ? '⚠️ BRAKUJE!' : '✅'}`);
  }

  // Podsumowanie
  console.log("\n=== Podsumowanie ===");
  if (duplicatesFound.length === 0 && brokenIds.length === 0) {
    console.log("✅ Migracja zakończona sukcesem!");
    console.log("   - Brak duplikatów");
    console.log("   - Wszystkie ID są poprawne");
    console.log("\n📋 Następne kroki:");
    console.log("   1. Uruchom: node scripts/fix-sets-ids.mjs");
    console.log("   2. Zreimportuj brakujące karty 31-99 dla setów SWSH");
  } else {
    console.log("⚠️  Wymagane dodatkowe działania:");
    if (duplicatesFound.length > 0) {
      console.log(`   - Usuń ${duplicatesFound.length} grup duplikatów`);
    }
    if (brokenIds.length > 0) {
      console.log(`   - Napraw ${brokenIds.length} uszkodzonych ID`);
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});






