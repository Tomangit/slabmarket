/**
 * Script to generate and update slugs for existing cards in database
 * Run this after migration if you already have cards without slugs
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { generateCardSlug } from "./utils.js";
import crypto from "crypto";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function generateSlugsForExistingCards() {
  console.log("=== Generating Slugs for Existing Cards ===\n");

  // Fetch all cards without slugs
  console.log("Fetching cards without slugs...");
  const { data: cardsWithoutSlugs, error: fetchError } = await supabase
    .from("cards")
    .select("id, name, set_name, card_number, slug")
    .is("slug", null)
    .limit(1000); // Process in batches

  if (fetchError) {
    console.error(`✗ Error fetching cards: ${fetchError.message}`);
    throw fetchError;
  }

  if (!cardsWithoutSlugs || cardsWithoutSlugs.length === 0) {
    console.log("✓ No cards without slugs found!");
    return;
  }

  console.log(`✓ Found ${cardsWithoutSlugs.length} cards without slugs\n`);

  // Check for existing slugs to avoid collisions
  console.log("Fetching existing slugs for collision detection...");
  const { data: cardsWithSlugs, error: slugError } = await supabase
    .from("cards")
    .select("slug")
    .not("slug", "is", null);

  if (slugError) {
    console.warn(`⚠ Warning: Could not fetch existing slugs: ${slugError.message}`);
  }

  const existingSlugs = new Set((cardsWithSlugs || []).map(c => c.slug));
  console.log(`✓ Found ${existingSlugs.size} existing slugs\n`);

  // Generate slugs
  console.log("Generating slugs...");
  const updates = [];
  let collisionCount = 0;

  for (const card of cardsWithoutSlugs) {
    let slug = generateCardSlug(card.name, card.set_name, card.card_number);
    
    // Check for collisions and make unique
    if (existingSlugs.has(slug)) {
      const hash = crypto.createHash("md5").update(card.id).digest("hex").substring(0, 6);
      slug = `${slug}-${hash}`;
      collisionCount++;
    }

    existingSlugs.add(slug); // Add to set for next iterations

    updates.push({
      id: card.id,
      slug,
    });
  }

  if (collisionCount > 0) {
    console.log(`⚠ Detected ${collisionCount} slug collisions (resolved with hash)\n`);
  }

  console.log(`✓ Generated ${updates.length} slugs\n`);

  // Update in chunks
  const chunkSize = 100;
  let updatedCount = 0;

  console.log(`Updating cards in chunks of ${chunkSize}...\n`);

  for (let i = 0; i < updates.length; i += chunkSize) {
    const chunk = updates.slice(i, i + chunkSize);
    const chunkNum = Math.floor(i / chunkSize) + 1;
    const totalChunks = Math.ceil(updates.length / chunkSize);

    console.log(`Processing chunk ${chunkNum}/${totalChunks} (${chunk.length} cards)...`);

    // Update each card individually to handle conflicts
    for (const update of chunk) {
      const { error } = await supabase
        .from("cards")
        .update({ slug: update.slug, updated_at: new Date().toISOString() })
        .eq("id", update.id);

      if (error) {
        console.error(`  ✗ Error updating card ${update.id}: ${error.message}`);
      } else {
        updatedCount++;
      }
    }

    console.log(`  ✓ Chunk ${chunkNum} completed\n`);
  }

  console.log("=".repeat(60));
  console.log(`✓ Successfully updated ${updatedCount} cards with slugs`);
  console.log("=".repeat(60));
}

generateSlugsForExistingCards().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});

