#!/usr/bin/env node
/**
 * Skrypt do weryfikacji migracji bazy danych
 * Sprawdza czy wszystkie tabele, widoki i dane są na miejscu
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

console.log("🔍 Weryfikacja migracji bazy danych...\n");

async function checkTable(tableName) {
  const { count, error } = await supabase
    .from(tableName)
    .select("*", { count: "exact", head: true });
  
  if (error) {
    return { exists: false, count: 0, error: error.message };
  }
  return { exists: true, count: count || 0 };
}

async function checkView(viewName) {
  const { data, error } = await supabase
    .from(viewName)
    .select("id")
    .limit(1);
  
  if (error) {
    return { exists: false, error: error.message };
  }
  return { exists: true };
}

async function main() {
  const results = {
    tables: {},
    views: {},
    data: {},
  };

  // Sprawdź tabele
  console.log("📊 Sprawdzanie tabel...");
  const tables = [
    "profiles",
    "categories",
    "grading_companies",
    "cards",
    "slabs",
    "sets",
    "transactions",
    "reviews",
    "notifications",
    "watchlists",
    "wishlists",
    "wishlist_items",
    "cart_sessions",
    "messages",
    "disputes",
    "price_history",
    "checkout_events",
  ];

  for (const table of tables) {
    const result = await checkTable(table);
    results.tables[table] = result;
    if (result.exists) {
      console.log(`  ✅ ${table}: ${result.count} rekordów`);
    } else {
      console.log(`  ❌ ${table}: ${result.error}`);
    }
  }

  // Sprawdź widoki
  console.log("\n👁️  Sprawdzanie widoków...");
  const views = ["marketplace_cards"];

  for (const view of views) {
    const result = await checkView(view);
    results.views[view] = result;
    if (result.exists) {
      console.log(`  ✅ ${view}: istnieje`);
    } else {
      console.log(`  ❌ ${view}: ${result.error}`);
    }
  }

  // Podsumowanie
  console.log("\n📋 Podsumowanie:");
  const tablesOk = Object.values(results.tables).filter((r) => r.exists).length;
  const viewsOk = Object.values(results.views).filter((r) => r.exists).length;
  
  console.log(`  Tabele: ${tablesOk}/${tables.length} istnieją`);
  console.log(`  Widoki: ${viewsOk}/${views.length} istnieją`);
  
  // Ważne dane
  console.log("\n💾 Ważne dane:");
  console.log(`  Sets: ${results.tables.sets?.count || 0}`);
  console.log(`  Karty: ${results.tables.cards?.count || 0}`);
  console.log(`  Kategorie: ${results.tables.categories?.count || 0}`);
  console.log(`  Firmy certyfikujące: ${results.tables.grading_companies?.count || 0}`);

  // Status gotowości
  console.log("\n🎯 Status gotowości do importu:");
  const ready =
    results.tables.sets?.exists &&
    results.tables.cards?.exists &&
    results.views.marketplace_cards?.exists &&
    results.tables.categories?.count > 0 &&
    results.tables.grading_companies?.count > 0;

  if (ready) {
    console.log("  ✅ GOTOWE DO IMPORTU KART!");
  } else {
    console.log("  ⚠️  Sprawdź powyższe błędy przed importem");
  }
}

main().catch((error) => {
  console.error("❌ Błąd:", error);
  process.exit(1);
});

