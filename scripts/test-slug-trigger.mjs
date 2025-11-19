/**
 * Script to test if the slug trigger works by trying to insert a test card
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { v5 as uuidv5 } from "uuid";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Use the same namespace as import scripts
const CARD_UUID_NAMESPACE = "3c7c5669-9c35-4d90-9f3f-9ad44e3d8adc"; // arbitrary, but constant

async function testSlugTrigger() {
  console.log("Testing slug trigger...\n");

  // Create a test card WITHOUT slug to see if trigger generates it
  const testCard = {
    id: uuidv5("TEST::Test Card::123", CARD_UUID_NAMESPACE),
    name: "Test Card for Slug Trigger",
    set_name: "Test Set",
    card_number: "TEST123",
    // slug: null - intentionally NOT setting slug to test trigger
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  console.log("1. Inserting test card WITHOUT slug...");
  console.log(`   Card ID: ${testCard.id}`);
  console.log(`   Name: ${testCard.name}`);
  console.log(`   Set: ${testCard.set_name}`);
  console.log(`   Card Number: ${testCard.card_number}`);
  console.log(`   Slug (before insert): ${testCard.slug || "NOT SET"}\n`);

  try {
    const { data: insertedCard, error: insertError } = await supabase
      .from("cards")
      .insert(testCard)
      .select()
      .single();

    if (insertError) {
      // If card already exists, try to get it
      if (insertError.code === "23505") {
        console.log("   ⚠ Card already exists, fetching it...");
        const { data: existingCard, error: fetchError } = await supabase
          .from("cards")
          .select("*")
          .eq("id", testCard.id)
          .single();

        if (fetchError) {
          console.error(`   ✗ Error fetching existing card: ${fetchError.message}`);
          return;
        }

        console.log(`   ✓ Card found with slug: ${existingCard.slug || "NULL"}`);
        
        if (existingCard.slug) {
          console.log("\n✅ Trigger działa! Slug został wygenerowany automatycznie.");
        } else {
          console.log("\n⚠ Slug nie został wygenerowany. Trigger może nie działać.");
        }

        // Clean up - delete test card
        console.log("\n2. Cleaning up test card...");
        await supabase.from("cards").delete().eq("id", testCard.id);
        console.log("   ✓ Test card deleted");
        return;
      }

      console.error(`   ✗ Error inserting card: ${insertError.message}`);
      return;
    }

    console.log(`   ✓ Card inserted successfully`);
    console.log(`   Slug (after insert): ${insertedCard.slug || "NULL"}\n`);

    if (insertedCard.slug) {
      console.log("✅ Trigger działa! Slug został wygenerowany automatycznie.");
      console.log(`   Wygenerowany slug: ${insertedCard.slug}`);
    } else {
      console.log("⚠ Slug nie został wygenerowany. Trigger może nie działać.");
    }

    // Clean up - delete test card
    console.log("\n2. Cleaning up test card...");
    const { error: deleteError } = await supabase.from("cards").delete().eq("id", testCard.id);

    if (deleteError) {
      console.error(`   ✗ Error deleting test card: ${deleteError.message}`);
    } else {
      console.log("   ✓ Test card deleted");
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

testSlugTrigger().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

