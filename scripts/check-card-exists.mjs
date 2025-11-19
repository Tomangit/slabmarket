/**
 * Script to check if a specific card exists in the database
 * Usage: node scripts/check-card-exists.mjs <card-id>
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const cardId = process.argv[2];

if (!cardId) {
  console.error("Usage: node scripts/check-card-exists.mjs <card-id>");
  process.exit(1);
}

async function checkCard() {
  console.log(`Checking if card exists: ${cardId}\n`);

  // Check in cards table
  const { data: card, error: cardError } = await supabase
    .from("cards")
    .select("*")
    .eq("id", cardId)
    .maybeSingle();

  if (cardError) {
    console.error("Error checking card:", cardError);
    return;
  }

  if (card) {
    console.log("✅ Card found in cards table:");
    console.log(JSON.stringify(card, null, 2));
  } else {
    console.log("❌ Card NOT found in cards table");
  }

  // Check in marketplace_cards view
  const { data: marketplaceCard, error: viewError } = await supabase
    .from("marketplace_cards")
    .select("*")
    .eq("id", cardId)
    .maybeSingle();

  if (viewError) {
    console.error("Error checking marketplace_cards view:", viewError);
    return;
  }

  if (marketplaceCard) {
    console.log("\n✅ Card found in marketplace_cards view:");
    console.log(JSON.stringify(marketplaceCard, null, 2));
  } else {
    console.log("\n❌ Card NOT found in marketplace_cards view");
  }

  // Check if there are any slabs with this card_id
  const { data: slabs, error: slabsError } = await supabase
    .from("slabs")
    .select("id, name, card_id, status")
    .eq("card_id", cardId);

  if (slabsError) {
    console.error("Error checking slabs:", slabsError);
    return;
  }

  if (slabs && slabs.length > 0) {
    console.log(`\n📦 Found ${slabs.length} slab(s) with this card_id:`);
    slabs.forEach((slab) => {
      console.log(`  - ${slab.name} (ID: ${slab.id}, Status: ${slab.status})`);
    });
  } else {
    console.log("\n📦 No slabs found with this card_id");
  }
}

checkCard().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});

