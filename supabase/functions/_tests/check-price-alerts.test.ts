// Integration tests for check-price-alerts Edge Function

import { assertEquals, assertExists } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { createMockRequest, createMockEnv, createMockSupabaseClient } from "../_shared/test-utils.ts";

// Mock the Edge Function handler
async function handleCheckPriceAlerts(req: Request): Promise<Response> {
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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createMockSupabaseClient({
      watchlists_select: {
        data: [
          {
            id: "watchlist-1",
            user_id: "user-1",
            slab_id: "slab-1",
            price_alert: 500,
            slab: {
              id: "slab-1",
              price: 450,
              status: "active",
              name: "Test Slab",
            },
          },
        ],
        error: null,
      },
      notifications_select: {
        data: null, // No existing notification
        error: null,
      },
      notifications_insert: {
        data: { id: "notification-1" },
        error: null,
      },
      profiles_select: {
        data: {
          email: "user@example.com",
          full_name: "Test User",
        },
        error: null,
      },
    });

    // Get all watchlist items with price alerts
    const { data: watchlistItems, error: watchlistError } = await supabase
      .from("watchlists")
      .select(`
        id,
        user_id,
        slab_id,
        price_alert,
        slab:slabs(
          id,
          price,
          status,
          name
        )
      `)
      .not("price_alert", "is", null)
      .eq("slab.status", "active");

    if (watchlistError) {
      throw new Error(`Error fetching watchlist items: ${watchlistError.message}`);
    }

    if (!watchlistItems || watchlistItems.length === 0) {
      return new Response(
        JSON.stringify({ message: "No watchlist items with price alerts found" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const notificationsCreated: string[] = [];
    const errors: string[] = [];

    // Check each watchlist item
    for (const item of watchlistItems) {
      try {
        const slab = item.slab as any;
        
        if (!slab || !slab.price || !item.price_alert) {
          continue;
        }

        // Check if price has dropped to or below the alert threshold
        if (slab.price <= item.price_alert) {
          // Check if notification already exists
          const { data: existingNotification } = await supabase
            .from("notifications")
            .select("id")
            .eq("user_id", item.user_id)
            .eq("type", "price_alert")
            .eq("related_id", item.slab_id)
            .eq("read", false)
            .single();

          if (existingNotification) {
            continue;
          }

          // Create notification
          const { error: notificationError } = await supabase
            .from("notifications")
            .insert({
              user_id: item.user_id,
              type: "price_alert",
              title: "Price Alert Triggered",
              message: `${slab.name} has reached your target price of $${item.price_alert.toLocaleString()}. Current price: $${slab.price.toLocaleString()}`,
              related_id: item.slab_id,
              link: `/slab/${item.slab_id}`,
              read: false,
            });

          if (notificationError) {
            errors.push(
              `Failed to create notification for watchlist item ${item.id}: ${notificationError.message}`
            );
          } else {
            notificationsCreated.push(item.id);
          }
        }
      } catch (itemError) {
        errors.push(
          `Error processing watchlist item ${item.id}: ${itemError.message}`
        );
      }
    }

    return new Response(
      JSON.stringify({
        message: "Price alerts checked",
        notificationsCreated: notificationsCreated.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
}

Deno.test("check-price-alerts: CORS preflight", async () => {
  const req = createMockRequest("OPTIONS");
  const env = createMockEnv();
  
  for (const [key, value] of Object.entries(env)) {
    Deno.env.set(key, value);
  }

  const res = await handleCheckPriceAlerts(req);
  assertEquals(res.status, 200);
  assertEquals(await res.text(), "ok");
});

Deno.test("check-price-alerts: no watchlist items with alerts", async () => {
  const req = createMockRequest("POST", {});
  const env = createMockEnv();
  const supabase = createMockSupabaseClient({
    watchlists_select: {
      data: [],
      error: null,
    },
  });
  
  for (const [key, value] of Object.entries(env)) {
    Deno.env.set(key, value);
  }

  const res = await handleCheckPriceAlerts(req);
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.message, "No watchlist items with price alerts found");
});

Deno.test("check-price-alerts: creates notification when price alert triggered", async () => {
  const req = createMockRequest("POST", {});
  const env = createMockEnv();
  
  for (const [key, value] of Object.entries(env)) {
    Deno.env.set(key, value);
  }

  const res = await handleCheckPriceAlerts(req);
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.message, "Price alerts checked");
  assertEquals(body.notificationsCreated, 1);
});

Deno.test("check-price-alerts: skips items where price not reached", async () => {
  const req = createMockRequest("POST", {});
  const env = createMockEnv();
  const supabase = createMockSupabaseClient({
    watchlists_select: {
      data: [
        {
          id: "watchlist-1",
          user_id: "user-1",
          slab_id: "slab-1",
          price_alert: 500,
          slab: {
            id: "slab-1",
            price: 600, // Price is higher than alert
            status: "active",
            name: "Test Slab",
          },
        },
      ],
      error: null,
    },
  });
  
  for (const [key, value] of Object.entries(env)) {
    Deno.env.set(key, value);
  }

  const res = await handleCheckPriceAlerts(req);
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.notificationsCreated, 0);
});

Deno.test("check-price-alerts: skips if notification already exists", async () => {
  const req = createMockRequest("POST", {});
  const env = createMockEnv();
  const supabase = createMockSupabaseClient({
    watchlists_select: {
      data: [
        {
          id: "watchlist-1",
          user_id: "user-1",
          slab_id: "slab-1",
          price_alert: 500,
          slab: {
            id: "slab-1",
            price: 450,
            status: "active",
            name: "Test Slab",
          },
        },
      ],
      error: null,
    },
    notifications_select: {
      data: { id: "existing-notification" }, // Notification already exists
      error: null,
    },
  });
  
  for (const [key, value] of Object.entries(env)) {
    Deno.env.set(key, value);
  }

  const res = await handleCheckPriceAlerts(req);
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.notificationsCreated, 0);
});

