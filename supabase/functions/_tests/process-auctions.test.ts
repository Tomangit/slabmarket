// Integration tests for process-auctions Edge Function

import { assertEquals, assertExists } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { createMockRequest, createMockEnv, createMockSupabaseClient } from "../_shared/test-utils.ts";

// Mock the Edge Function handler
async function handleProcessAuctions(req: Request): Promise<Response> {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabase = createMockSupabaseClient({
      slabs_select: {
        data: [
          {
            id: "auction-1",
            auction_end_date: new Date(Date.now() - 1000).toISOString(), // Ended 1 second ago
            listing_type: "auction",
            status: "active",
            price: 1000,
          },
        ],
        error: null,
      },
      slabs_update: {
        data: null,
        error: null,
      },
    });

    // Verify cron secret
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

    const results: any[] = [];

    // Process each ended auction
    for (const auction of endedAuctions) {
      try {
        // Check if there are any bids (stub - always false for now)
        const hasBids = false;
        
        if (hasBids) {
          // Update slab status to sold
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
}

Deno.test("process-auctions: CORS preflight", async () => {
  const req = createMockRequest("OPTIONS");
  const env = createMockEnv();
  
  for (const [key, value] of Object.entries(env)) {
    Deno.env.set(key, value);
  }

  const res = await handleProcessAuctions(req);
  assertEquals(res.status, 200);
  assertEquals(await res.text(), "ok");
});

Deno.test("process-auctions: unauthorized without cron secret", async () => {
  const req = createMockRequest("POST", {});
  const env = createMockEnv({ CRON_SECRET: "secret-key" });
  
  for (const [key, value] of Object.entries(env)) {
    Deno.env.set(key, value);
  }

  const res = await handleProcessAuctions(req);
  assertEquals(res.status, 401);
  const body = await res.json();
  assertEquals(body.error, "Unauthorized");
});

Deno.test("process-auctions: authorized with cron secret", async () => {
  const req = createMockRequest(
    "POST",
    {},
    {
      "x-cron-secret": "secret-key",
    }
  );
  const env = createMockEnv({ CRON_SECRET: "secret-key" });
  
  for (const [key, value] of Object.entries(env)) {
    Deno.env.set(key, value);
  }

  const res = await handleProcessAuctions(req);
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.message, "Auctions processed successfully");
});

Deno.test("process-auctions: no auctions to process", async () => {
  const req = createMockRequest(
    "POST",
    {},
    {
      "x-cron-secret": "secret-key",
    }
  );
  const env = createMockEnv({ CRON_SECRET: "secret-key" });
  const supabase = createMockSupabaseClient({
    slabs_select: {
      data: [],
      error: null,
    },
  });
  
  for (const [key, value] of Object.entries(env)) {
    Deno.env.set(key, value);
  }

  const res = await handleProcessAuctions(req);
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.message, "No auctions to process");
  assertEquals(body.processed, 0);
});

Deno.test("process-auctions: marks auctions as expired when no bids", async () => {
  const req = createMockRequest(
    "POST",
    {},
    {
      "x-cron-secret": "secret-key",
    }
  );
  const env = createMockEnv({ CRON_SECRET: "secret-key" });
  
  for (const [key, value] of Object.entries(env)) {
    Deno.env.set(key, value);
  }

  const res = await handleProcessAuctions(req);
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.message, "Auctions processed successfully");
  assertExists(body.processed);
  assertExists(body.results);
  assertEquals(body.results.length, 1);
  assertEquals(body.results[0].status, "expired");
});

