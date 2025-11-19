#!/usr/bin/env node
/**
 * Test zapytania do marketplace_cards
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testQuery() {
  console.log("Test zapytania do marketplace_cards...\n");

  // Test 1: Podstawowe zapytanie
  console.log("1. Podstawowe zapytanie (limit 5):");
  const { data: basicData, error: basicError } = await supabase
    .from("marketplace_cards")
    .select("*")
    .limit(5);

  if (basicError) {
    console.error("  ❌ Błąd:", basicError.message);
  } else {
    console.log(`  ✅ Znaleziono ${basicData.length} kart`);
    basicData.forEach((c, i) => {
      console.log(`     ${i + 1}. ${c.name || "NULL"} (${c.set_name || "NULL"})`);
    });
  }

  // Test 2: Z liczeniem
  console.log("\n2. Zapytanie z liczeniem:");
  const { data: countData, error: countError, count } = await supabase
    .from("marketplace_cards")
    .select("*", { count: "exact" })
    .limit(5);

  if (countError) {
    console.error("  ❌ Błąd:", countError.message);
  } else {
    console.log(`  ✅ Całkowita liczba kart: ${count}`);
    console.log(`  ✅ Zwrócono: ${countData.length} kart`);
  }

  // Test 3: Z sortowaniem (jak w aplikacji)
  console.log("\n3. Zapytanie z sortowaniem (popular):");
  const { data: sortedData, error: sortedError } = await supabase
    .from("marketplace_cards")
    .select("*", { count: "exact" })
    .order("total_listings", { ascending: false, nullsFirst: false })
    .limit(5);

  if (sortedError) {
    console.error("  ❌ Błąd:", sortedError.message);
  } else {
    console.log(`  ✅ Znaleziono ${sortedData.length} kart`);
    sortedData.forEach((c, i) => {
      console.log(`     ${i + 1}. ${c.name || "NULL"} - listings: ${c.total_listings || 0}`);
    });
  }

  // Test 4: Z filtrem ceny (jak w aplikacji - domyślne 0-10000)
  console.log("\n4. Zapytanie z filtrem ceny (0-10000):");
  const { data: priceData, error: priceError } = await supabase
    .from("marketplace_cards")
    .select("*", { count: "exact" })
    .or("lowest_price.gte.0,lowest_price.is.null")
    .or("lowest_price.lte.10000,lowest_price.is.null")
    .limit(5);

  if (priceError) {
    console.error("  ❌ Błąd:", priceError.message);
  } else {
    console.log(`  ✅ Znaleziono ${priceData.length} kart`);
  }
}

testQuery().catch((error) => {
  console.error("❌ Błąd:", error);
  process.exit(1);
});

