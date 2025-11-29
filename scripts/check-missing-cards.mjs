#!/usr/bin/env node

/**
 * Sprawdza czy nie pominęliśmy kart podczas importu
 * - Znajduje sety z podejrzanie małą liczbą kart
 * - Sprawdza luki w numeracji kart
 * - Porównuje z oczekiwanymi liczbami (jeśli dostępne)
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

// Oczekiwane liczby kart dla niektórych setów (na podstawie danych które pokazałeś)
const EXPECTED_CARD_COUNTS = {
  "D23 Collection": 6,
  "Challenge Promo": 9,
  "Pokémon Rumble": 16,
  "POP Series 1": 17,
  "POP Series 2": 17,
  "POP Series 3": 17,
  "POP Series 4": 17,
  "POP Series 5": 17,
  "POP Series 6": 17,
  "POP Series 7": 17,
  "POP Series 8": 17,
  "POP Series 9": 17,
  "Detective Pikachu": 18,
  "Southern Islands": 18,
  "Dragon Vault": 21,
  "Celebrations": 25,
  "Yellow A Alternate": 30,
  "Double Crisis": 34,
  "Promo Set 2": 34,
  "Kalos Starter Set": 39,
  "Nintendo Black Star Promos": 40,
  "Promo Set 1": 41,
  "Destined Rivals": 51,
  "SVP Black Star Promos": 51,
  "Wizards Black Star Promos": 53,
  "Fossil": 62,
  "Jungle": 64,
  "Neo Revelation": 66,
  "Hidden Fates": 69,
  "Astral Radiance": 72,
  "Brilliant Stars": 72,
  "Lost Origin": 72,
  "Silver Tempest": 72,
  "Neo Discovery": 75,
  "Team Rocket": 83,
  "Undaunted": 90,
  "Legend Maker": 93,
  "Call of Legends": 95,
  "Unleashed": 95,
  "Team Magma vs Team Aqua": 97,
  "Emerging Powers": 98,
  "Ancient Origins": 100,
  "Crystal Guardians": 100,
  "Dragon": 100,
  "Majestic Dawn": 100,
  "Sandstorm": 100,
  "Dragon Frontiers": 101,
  "Base Set": 102,
  "Hidden Legends": 102,
  "Noble Victories": 102,
  "Triumphant": 102,
  "Next Destinies": 103,
  "Plasma Blast": 105,
  "Great Encounters": 106,
  "Stormfront": 106,
  "Emerald": 107,
  "Deoxys": 108,
  "Power Keepers": 108,
  "Flashfire": 109,
  "Ruby & Sapphire": 109,
  "Roaring Skies": 110,
  "Arceus": 111,
  "Dark Explorers": 111,
  "Holon Phantoms": 111,
  "Neo Genesis": 111,
  "Team Rocket Returns": 111,
  "Evolutions": 113,
  "Furious Fists": 113,
  "Generations": 113,
  "Neo Destiny": 113,
  "Delta Species": 114,
  "Rising Rivals": 114,
  "Black & White": 115,
  "FireRed & LeafGreen": 116,
  "Steam Siege": 116,
  "Unseen Forces": 117,
  "Phantom Forces": 122,
  "Plasma Freeze": 122,
  "BREAKpoint": 123,
  "HeartGold SoulSilver": 123,
  "Crimson Invasion": 124,
  "Mysterious Treasures": 124,
  "Fates Collide": 125,
  "Dragons Exalted": 128,
  "Base Set 2": 130,
  "Diamond & Pearl": 130,
  "Gym Challenge": 132,
  "Gym Heroes": 132,
  "Secret Wonders": 132,
  "Platinum": 133,
  "Plasma Storm": 138,
  "Legendary Treasures": 140,
  "Aquapolis": 146,
  "Forbidden Light": 146,
  "Legends Awakened": 146,
  "XY": 146,
  "Battle Styles": 150,
  "Boundaries Crossed": 150,
  "BREAKthrough": 150,
  "Burning Shadows": 150,
};

function extractNumber(cardNumber) {
  if (!cardNumber) return null;
  const num = cardNumber.replace(/[^0-9]/g, '');
  return num ? parseInt(num, 10) : null;
}

async function findNumberGaps(setName, cardNumbers) {
  const numbers = cardNumbers
    .map(extractNumber)
    .filter(n => n !== null && n > 0)
    .sort((a, b) => a - b);

  if (numbers.length === 0) return [];

  const min = numbers[0];
  const max = numbers[numbers.length - 1];
  const gaps = [];

  for (let i = min; i <= max; i++) {
    if (!numbers.includes(i)) {
      gaps.push(i);
    }
  }

  return gaps;
}

async function main() {
  console.log("=== Sprawdzanie brakujących kart ===\n");

  // 1. Pobierz wszystkie sety
  const { data: sets, error: setsError } = await supabase
    .from("sets")
    .select("id, name, language")
    .order("name");

  if (setsError) {
    console.error("Błąd podczas pobierania setów:", setsError.message);
    process.exit(1);
  }

  console.log(`Znaleziono ${sets?.length || 0} setów\n`);

  // 2. Dla każdego setu sprawdź liczbę kart
  const results = {
    setsWithoutCards: [],
    setsWithFewCards: [],
    setsWithGaps: [],
    setsWithMismatch: [],
  };

  for (const set of sets || []) {
    const { data: cards, error: cardsError } = await supabase
      .from("cards")
      .select("card_number")
      .eq("set_name", set.name);

    if (cardsError) {
      console.error(`Błąd dla "${set.name}": ${cardsError.message}`);
      continue;
    }

    const cardCount = cards?.length || 0;
    const cardNumbers = (cards || []).map(c => c.card_number);

    // Sety bez kart
    if (cardCount === 0) {
      results.setsWithoutCards.push({
        name: set.name,
        language: set.language,
        id: set.id,
      });
      continue;
    }

    // Sety z podejrzanie małą liczbą kart
    const expected = EXPECTED_CARD_COUNTS[set.name];
    if (expected && cardCount < expected * 0.8) {
      // Jeśli mamy mniej niż 80% oczekiwanej liczby
      results.setsWithMismatch.push({
        name: set.name,
        language: set.language,
        actual: cardCount,
        expected: expected,
        difference: expected - cardCount,
      });
    } else if (!expected && cardCount < 10) {
      // Sety bez oczekiwanej liczby, ale z bardzo małą liczbą kart
      results.setsWithFewCards.push({
        name: set.name,
        language: set.language,
        count: cardCount,
      });
    }

    // Sprawdź luki w numeracji (tylko dla setów z numerami)
    const gaps = await findNumberGaps(set.name, cardNumbers);
    if (gaps.length > 0 && gaps.length <= 20) {
      // Pokaż tylko jeśli jest mniej niż 20 luk (żeby nie spamować)
      results.setsWithGaps.push({
        name: set.name,
        language: set.language,
        gaps: gaps,
        gapCount: gaps.length,
        totalCards: cardCount,
      });
    }
  }

  // 3. Wyświetl wyniki
  console.log("📊 WYNIKI ANALIZY\n");

  // Sety bez kart
  if (results.setsWithoutCards.length > 0) {
    console.log(`⚠️  SETY BEZ KART (${results.setsWithoutCards.length}):`);
    results.setsWithoutCards.forEach(s => {
      console.log(`  - "${s.name}" (${s.language}) [ID: ${s.id}]`);
    });
    console.log();
  } else {
    console.log("✅ Wszystkie sety mają przynajmniej kilka kart\n");
  }

  // Sety z mniejszą liczbą kart niż oczekiwana
  if (results.setsWithMismatch.length > 0) {
    console.log(`⚠️  SETY Z MNIEJSZĄ LICZBĄ KART NIŻ OCZEKIWANA (${results.setsWithMismatch.length}):`);
    results.setsWithMismatch
      .sort((a, b) => b.difference - a.difference)
      .forEach(s => {
        console.log(`  - "${s.name}" (${s.language}):`);
        console.log(`    • Oczekiwane: ${s.expected}, Faktyczne: ${s.actual}, Brakuje: ${s.difference}`);
      });
    console.log();
  } else {
    console.log("✅ Wszystkie sety mają oczekiwaną liczbę kart\n");
  }

  // Sety z małą liczbą kart (bez oczekiwanej wartości)
  if (results.setsWithFewCards.length > 0) {
    console.log(`⚠️  SETY Z MAŁĄ LICZBĄ KART (${results.setsWithFewCards.length}):`);
    results.setsWithFewCards
      .sort((a, b) => a.count - b.count)
      .forEach(s => {
        console.log(`  - "${s.name}" (${s.language}): ${s.count} kart`);
      });
    console.log();
  }

  // Sety z lukami w numeracji
  if (results.setsWithGaps.length > 0) {
    console.log(`⚠️  SETY Z LUKAMI W NUMERACJI (${results.setsWithGaps.length}):`);
    results.setsWithGaps
      .sort((a, b) => b.gapCount - a.gapCount)
      .slice(0, 20) // Pokaż tylko pierwsze 20
      .forEach(s => {
        const gapRange = s.gaps.length > 10 
          ? `${s.gaps.slice(0, 5).join(', ')} ... ${s.gaps.slice(-5).join(', ')} (${s.gaps.length} luk)`
          : s.gaps.join(', ');
        console.log(`  - "${s.name}" (${s.language}):`);
        console.log(`    • ${s.totalCards} kart, ${s.gapCount} luk: [${gapRange}]`);
      });
    if (results.setsWithGaps.length > 20) {
      console.log(`  ... i ${results.setsWithGaps.length - 20} więcej`);
    }
    console.log();
  } else {
    console.log("✅ Brak luk w numeracji kart\n");
  }

  // 4. Podsumowanie
  console.log("=== PODSUMOWANIE ===");
  const totalIssues = 
    results.setsWithoutCards.length +
    results.setsWithMismatch.length +
    results.setsWithFewCards.length +
    results.setsWithGaps.length;

  if (totalIssues === 0) {
    console.log("✅ Wszystko wygląda dobrze! Nie znaleziono problemów z brakującymi kartami.");
  } else {
    console.log(`⚠️  Znaleziono ${totalIssues} potencjalnych problemów:`);
    console.log(`   - Sety bez kart: ${results.setsWithoutCards.length}`);
    console.log(`   - Sety z mniejszą liczbą kart: ${results.setsWithMismatch.length}`);
    console.log(`   - Sety z małą liczbą kart: ${results.setsWithFewCards.length}`);
    console.log(`   - Sety z lukami w numeracji: ${results.setsWithGaps.length}`);
    console.log("\n💡 Wskazówki:");
    if (results.setsWithoutCards.length > 0) {
      console.log("   - Sety bez kart mogą wymagać importu");
    }
    if (results.setsWithMismatch.length > 0) {
      console.log("   - Sety z mniejszą liczbą kart mogą wymagać reimportu");
    }
    if (results.setsWithGaps.length > 0) {
      console.log("   - Luki w numeracji mogą być normalne (promocje, warianty) lub wskazywać na brakujące karty");
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});






