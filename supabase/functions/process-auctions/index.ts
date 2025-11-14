// Supabase Edge Function: Process Auctions
// Cron job to process ending auctions and update their status

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AuctionResult {
  slab_id: string;
  status: "sold" | "expired";
  winning_bid?: number;
  winner_id?: string;
}

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

    // Verify this is a cron request (in production, verify the cron secret)
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

    const now = new Date().toISOString();

    // Find all active auctions that have ended
    const { data: endedAuctions, error: fetchError } = await supabase
      .from("slabs")
      .select("id, auction_end_date, listing_type, status, price")
      .eq("listing_type", "auction")
      .eq("status", "active")
      .lte("auction_end_date", now);

    if (fetchError) {
      throw fetchError;
    }

    if (!endedAuctions || endedAuctions.length === 0) {
      return new Response(
        JSON.stringify({
          message: "No auctions to process",
          processed: 0,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const results: AuctionResult[] = [];

    // Process each ended auction
    for (const auction of endedAuctions) {
      try {
        // Check if there are any bids (in a real system, you'd have a bids table)
        // For now, we'll mark auctions without bids as expired
        // In production, you'd check the bids table for the highest bid
        
        // TODO: Integrate with bids table when implemented
        // For now, we'll just mark auctions as expired if they ended
        const hasBids = false; // Placeholder - would check bids table
        
        if (hasBids) {
          // Update slab status to sold
          // In production, you'd also:
          // 1. Find the highest bid
          // 2. Create a transaction
          // 3. Notify the winner and seller
          
          await supabase
            .from("slabs")
            .update({
              status: "sold",
              updated_at: now,
            })
            .eq("id", auction.id);

          results.push({
            slab_id: auction.id,
            status: "sold",
          });
        } else {
          // No bids - mark as expired
          await supabase
            .from("slabs")
            .update({
              status: "expired",
              updated_at: now,
            })
            .eq("id", auction.id);

          results.push({
            slab_id: auction.id,
            status: "expired",
          });
        }
      } catch (auctionError) {
        console.error(`Error processing auction ${auction.id}:`, auctionError);
        // Continue with other auctions
      }
    }

    return new Response(
      JSON.stringify({
        message: "Auctions processed successfully",
        processed: results.length,
        results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in process-auctions function:", error);
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

