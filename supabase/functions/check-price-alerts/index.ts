// Edge Function to check price alerts and create notifications
// This should be run as a cron job (e.g., every hour)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
          // Check if notification already exists for this alert (to avoid duplicates)
          const { data: existingNotification } = await supabase
            .from("notifications")
            .select("id")
            .eq("user_id", item.user_id)
            .eq("type", "price_alert")
            .eq("related_id", item.slab_id)
            .eq("read", false)
            .single();

          if (existingNotification) {
            // Notification already exists, skip
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

            // Send email notification
            try {
              const { data: profile } = await supabase
                .from("profiles")
                .select("email, full_name")
                .eq("id", item.user_id)
                .single();

              if (profile?.email) {
                const supabaseUrl = Deno.env.get("SUPABASE_URL");
                const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

                if (supabaseUrl && supabaseAnonKey) {
                  await fetch(`${supabaseUrl}/functions/v1/send-notification-email`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${supabaseAnonKey}`,
                    },
                    body: JSON.stringify({
                      type: "price_alert",
                      email: profile.email,
                      data: {
                        userName: profile.full_name || "User",
                        itemName: slab.name,
                        targetPrice: item.price_alert,
                        currentPrice: slab.price,
                        slabId: item.slab_id,
                      },
                    }),
                  });
                }
              }
            } catch (emailError) {
              // Email sending is non-critical, just log
              console.error("Error sending price alert email:", emailError);
            }
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
});

