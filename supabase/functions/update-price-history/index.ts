// Supabase Edge Function: Update Price History
// Updates price_history table with current prices from active slabs

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify this is a cron request
    const cronSecret = req.headers.get("x-cron-secret");
    const expectedSecret = Deno.env.get("CRON_SECRET");
    
    if (expectedSecret && cronSecret !== expectedSecret) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    // Get all active slabs
    const { data: activeSlabs, error: fetchError } = await supabase
      .from("slabs")
      .select("id, price, updated_at")
      .eq("status", "active");

    if (fetchError) {
      throw fetchError;
    }

    if (!activeSlabs || activeSlabs.length === 0) {
      return new Response(
        JSON.stringify({
          message: "No active slabs to process",
          processed: 0,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let processed = 0;
    let skipped = 0;

    // Check if price_history table exists
    const { error: tableCheckError } = await supabase
      .from("price_history")
      .select("id")
      .limit(1);

    if (tableCheckError) {
      // Table doesn't exist - skip processing
      return new Response(
        JSON.stringify({
          message: "price_history table does not exist yet",
          processed: 0,
          skipped: activeSlabs.length,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Process each slab
    for (const slab of activeSlabs) {
      try {
        // Check if we already have a price entry for today
        // Use recorded_at date (YYYY-MM-DD format)
        const todayStart = new Date(today + "T00:00:00Z").toISOString();
        const todayEnd = new Date(today + "T23:59:59Z").toISOString();
        
        const { data: existingEntry } = await supabase
          .from("price_history")
          .select("id")
          .eq("slab_id", slab.id)
          .gte("recorded_at", todayStart)
          .lte("recorded_at", todayEnd)
          .single();

        if (existingEntry) {
          // Update existing entry if price changed
          const { error: updateError } = await supabase
            .from("price_history")
            .update({
              price: slab.price,
            })
            .eq("id", existingEntry.id);

          if (!updateError) {
            processed++;
          } else {
            skipped++;
          }
        } else {
          // Create new entry for today
          const { error: insertError } = await supabase
            .from("price_history")
            .insert({
              slab_id: slab.id,
              price: slab.price,
              recorded_at: new Date().toISOString(),
            });

          if (!insertError) {
            processed++;
          } else {
            skipped++;
          }
        }
      } catch (slabError) {
        console.error(`Error processing slab ${slab.id}:`, slabError);
        skipped++;
      }
    }

    return new Response(
      JSON.stringify({
        message: "Price history updated successfully",
        processed,
        skipped,
        total: activeSlabs.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in update-price-history function:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

