#!/usr/bin/env node
/**
 * Test zapytania do marketplace_cards z anon key (jak w aplikacji)
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testQuery() {
  console.log("Test zapytania do marketplace_cards z ANON key (jak w aplikacji)...\n");

  // Test 1: Podstawowe zapytanie (jak w aplikacji)
  console.log("1. Podstawowe zapytanie (jak getAllMarketplaceCards):");
  const page = 1;
  const pageSize = 100;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from("marketplace_cards")
    .select("*", { count: "exact" });

  // Filtry jak w aplikacji (domyślne)
  // min_price: 0, max_price: 10000 - nie są stosowane bo są domyślne
  // set_name: undefined (selectedSetSlug === "all")
  // search: undefined

  // Sortowanie jak w aplikacji (popular)
  query = query.order("total_listings", { ascending: false, nullsFirst: false });

  // Paginacja
  query = query.range(offset, offset + pageSize - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error("  ❌ Błąd:", error.message);
    console.error("  Szczegóły:", error);
  } else {
    console.log(`  ✅ Całkowita liczba kart: ${count}`);
    console.log(`  ✅ Zwrócono: ${data.length} kart`);
    if (data.length > 0) {
      console.log("  Przykładowe karty:");
      data.slice(0, 5).forEach((c, i) => {
        console.log(`     ${i + 1}. ${c.name || "NULL"} (${c.set_name || "NULL"}) - listings: ${c.total_listings || 0}`);
      });
    }
  }
}

testQuery().catch((error) => {
  console.error("❌ Błąd:", error);
  process.exit(1);
});

