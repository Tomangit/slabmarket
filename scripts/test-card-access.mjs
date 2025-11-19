/**
 * Script to test if a card can be accessed via anon key (simulating frontend)
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables.");
  console.error("Using anon key to simulate frontend access.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const cardId = process.argv[2] || "00914671-4a52-52b9-84f9-94030961fe89";

async function testCardAccess() {
  console.log(`Testing card access with ANON key (simulating frontend)\n`);
  console.log(`Card ID: ${cardId}\n`);

  // Test 1: Try direct query to cards table
  console.log("1. Testing direct query to cards table...");
  const { data: cardData, error: cardError } = await supabase
    .from("cards")
    .select(`
      *,
      category:categories!cards_category_id_fkey(id, name, slug)
    `)
    .eq("id", cardId)
    .maybeSingle();

  if (cardError) {
    console.error(`   ✗ Error: ${cardError.message} (code: ${cardError.code})`);
  } else if (cardData) {
    console.log(`   ✓ Card found in cards table:`);
    console.log(`     - Name: ${cardData.name}`);
    console.log(`     - Set: ${cardData.set_name}`);
    console.log(`     - Slug: ${cardData.slug || "NULL"}`);
  } else {
    console.log(`   ✗ Card not found in cards table`);
  }

  // Test 2: Try marketplace_cards view
  console.log("\n2. Testing marketplace_cards view...");
  const { data: viewData, error: viewError } = await supabase
    .from("marketplace_cards")
    .select("*")
    .eq("id", cardId)
    .maybeSingle();

  if (viewError) {
    console.error(`   ✗ Error: ${viewError.message} (code: ${viewError.code})`);
  } else if (viewData) {
    console.log(`   ✓ Card found in marketplace_cards view:`);
    console.log(`     - Name: ${viewData.name}`);
    console.log(`     - Set: ${viewData.set_name}`);
    console.log(`     - Slug: ${viewData.slug || "NULL"}`);
  } else {
    console.log(`   ✗ Card not found in marketplace_cards view`);
  }

  // Test 3: Try by slug if we have one
  if (viewData?.slug) {
    console.log(`\n3. Testing card access by slug: ${viewData.slug}...`);
    const { data: slugData, error: slugError } = await supabase
      .from("cards")
      .select(`
        *,
        category:categories!cards_category_id_fkey(id, name, slug)
      `)
      .eq("slug", viewData.slug)
      .maybeSingle();

    if (slugError) {
      console.error(`   ✗ Error: ${slugError.message} (code: ${slugError.code})`);
    } else if (slugData) {
      console.log(`   ✓ Card found by slug:`);
      console.log(`     - Name: ${slugData.name}`);
      console.log(`     - Set: ${slugData.set_name}`);
      console.log(`     - Slug: ${slugData.slug}`);
    } else {
      console.log(`   ✗ Card not found by slug`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("Summary:");
  if (cardData) {
    console.log("✓ Cards table: ACCESSIBLE");
  } else {
    console.log("✗ Cards table: NOT ACCESSIBLE");
  }
  if (viewData) {
    console.log("✓ Marketplace cards view: ACCESSIBLE");
  } else {
    console.log("✗ Marketplace cards view: NOT ACCESSIBLE");
  }
}

testCardAccess().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});

