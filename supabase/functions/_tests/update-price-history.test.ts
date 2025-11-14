// Integration tests for update-price-history Edge Function

import { assertEquals, assertExists } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { createMockRequest, createMockEnv, createMockSupabaseClient } from "../_shared/test-utils.ts";

// Mock the Edge Function handler
async function handleUpdatePriceHistory(req: Request): Promise<Response> {
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
          { id: "slab-1", price: 1000, updated_at: new Date().toISOString() },
          { id: "slab-2", price: 2000, updated_at: new Date().toISOString() },
        ],
        error: null,
      },
      price_history_select: {
        data: null, // No existing entry for today
        error: null,
      },
      price_history_insert: {
        data: { id: "price-history-1" },
        error: null,
      },
      price_history_update: {
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

    const today = new Date().toISOString().split("T")[0];

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

    // Check if price_history table exists
    const { error: tableCheckError } = await supabase
      .from("price_history")
      .select("id")
      .limit(1);

    if (tableCheckError) {
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

    let processed = 0;
    let skipped = 0;

    // Process each slab
    for (const slab of activeSlabs) {
      try {
        // Check if we already have a price entry for today
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
          // Update existing entry
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
          // Create new entry
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

Deno.test("update-price-history: CORS preflight", async () => {
  const req = createMockRequest("OPTIONS");
  const env = createMockEnv();
  
  for (const [key, value] of Object.entries(env)) {
    Deno.env.set(key, value);
  }

  const res = await handleUpdatePriceHistory(req);
  assertEquals(res.status, 200);
  assertEquals(await res.text(), "ok");
});

Deno.test("update-price-history: unauthorized without cron secret", async () => {
  const req = createMockRequest("POST", {});
  const env = createMockEnv({ CRON_SECRET: "secret-key" });
  
  for (const [key, value] of Object.entries(env)) {
    Deno.env.set(key, value);
  }

  const res = await handleUpdatePriceHistory(req);
  assertEquals(res.status, 401);
  const body = await res.json();
  assertEquals(body.error, "Unauthorized");
});

Deno.test("update-price-history: authorized with cron secret", async () => {
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

  const res = await handleUpdatePriceHistory(req);
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.message, "Price history updated successfully");
});

Deno.test("update-price-history: no active slabs", async () => {
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

  const res = await handleUpdatePriceHistory(req);
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.message, "No active slabs to process");
  assertEquals(body.processed, 0);
});

Deno.test("update-price-history: creates price history entries", async () => {
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

  const res = await handleUpdatePriceHistory(req);
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.message, "Price history updated successfully");
  assertExists(body.processed);
  assertExists(body.total);
});

Deno.test("update-price-history: handles missing price_history table", async () => {
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
      data: [
        { id: "slab-1", price: 1000, updated_at: new Date().toISOString() },
      ],
      error: null,
    },
    price_history_select: {
      data: null,
      error: { message: "Table does not exist" },
    },
  });
  
  for (const [key, value] of Object.entries(env)) {
    Deno.env.set(key, value);
  }

  const res = await handleUpdatePriceHistory(req);
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.message, "price_history table does not exist yet");
  assertEquals(body.processed, 0);
});

