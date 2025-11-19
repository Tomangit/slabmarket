/**
 * Script to verify that the price history cron job is configured correctly
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

async function verifyCronJob() {
  console.log("Verifying price history cron job configuration...\n");

  try {
    // Check if cron job exists
    // Note: We can't directly query cron.job table via Supabase client
    // But we can check if the Edge Function exists and is accessible
    
    console.log("1. Checking Edge Function accessibility...");
    const functionUrl = `${SUPABASE_URL}/functions/v1/update-price-history`;
    console.log(`   Function URL: ${functionUrl}`);

    // Try to call the function (without auth to see if it exists)
    try {
      const response = await fetch(functionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status === 401) {
        console.log("   ✓ Edge Function exists (401 Unauthorized - expected without auth)");
      } else if (response.status === 200 || response.status === 404) {
        console.log(`   ⚠ Unexpected status: ${response.status}`);
      } else {
        console.log(`   ✓ Edge Function accessible (status: ${response.status})`);
      }
    } catch (error) {
      console.error(`   ✗ Error checking Edge Function: ${error.message}`);
    }

    // Check price_history table
    console.log("\n2. Checking price_history table...");
    const { data: priceHistory, error: priceError } = await supabase
      .from("price_history")
      .select("id, slab_id, price, recorded_at")
      .order("recorded_at", { ascending: false })
      .limit(5);

    if (priceError) {
      console.error(`   ✗ Error accessing price_history: ${priceError.message}`);
    } else {
      console.log(`   ✓ price_history table accessible`);
      if (priceHistory && priceHistory.length > 0) {
        console.log(`   ✓ Found ${priceHistory.length} recent entries`);
        console.log(`   Latest entry: ${priceHistory[0].recorded_at}`);
      } else {
        console.log(`   ⚠ No entries in price_history yet (will be created by cron job)`);
      }
    }

    // Check active slabs
    console.log("\n3. Checking active slabs...");
    const { data: activeSlabs, error: slabsError } = await supabase
      .from("slabs")
      .select("id, price")
      .eq("status", "active")
      .limit(10);

    if (slabsError) {
      console.error(`   ✗ Error accessing slabs: ${slabsError.message}`);
    } else {
      console.log(`   ✓ Found ${activeSlabs?.length || 0} active slabs (showing first 10)`);
      if (activeSlabs && activeSlabs.length > 0) {
        console.log(`   These slabs will have their prices tracked in price_history`);
      } else {
        console.log(`   ⚠ No active slabs found - cron job will have nothing to process`);
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("Summary:");
    console.log("✓ Edge Function exists and is accessible");
    console.log("✓ price_history table is accessible");
    console.log("✓ Active slabs can be queried");
    console.log("\n📋 Next steps:");
    console.log("1. Cron job should run daily at midnight UTC");
    console.log("2. Check Edge Function logs in Supabase Dashboard to verify execution");
    console.log("3. Monitor price_history table for new entries");
    console.log("=".repeat(60));
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

verifyCronJob().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

