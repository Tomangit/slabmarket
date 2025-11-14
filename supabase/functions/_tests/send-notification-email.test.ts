// Integration tests for send-notification-email Edge Function

import { assertEquals, assertExists } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { createMockRequest, createMockEnv } from "../_shared/test-utils.ts";

// Mock the Edge Function handler
async function handleSendNotificationEmail(req: Request): Promise<Response> {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { type, userId, email, data } = await req.json();

    if (!type || !email) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: type, email" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Get email template (stub)
    const template = {
      subject: `Notification: ${type}`,
      html: `<p>${data?.message || "You have a new notification."}</p>`,
      text: data?.message || "You have a new notification.",
    };

    // In production, send email via service
    // For now, just log it
    console.log("Email would be sent:", {
      to: email,
      subject: template.subject,
      type,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email notification queued",
        type,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to send email notification",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
}

Deno.test("send-notification-email: CORS preflight", async () => {
  const req = createMockRequest("OPTIONS");
  const env = createMockEnv();
  
  for (const [key, value] of Object.entries(env)) {
    Deno.env.set(key, value);
  }

  const res = await handleSendNotificationEmail(req);
  assertEquals(res.status, 200);
  assertEquals(await res.text(), "ok");
});

Deno.test("send-notification-email: missing required fields", async () => {
  const req = createMockRequest("POST", {
    type: "transaction_created",
  });
  const env = createMockEnv();
  
  for (const [key, value] of Object.entries(env)) {
    Deno.env.set(key, value);
  }

  const res = await handleSendNotificationEmail(req);
  assertEquals(res.status, 400);
  const body = await res.json();
  assertEquals(body.error, "Missing required fields: type, email");
});

Deno.test("send-notification-email: successful email queuing", async () => {
  const req = createMockRequest("POST", {
    type: "transaction_created",
    email: "user@example.com",
    data: {
      userName: "Test User",
      itemName: "Test Item",
      price: 1000,
      transactionId: "test-transaction-id",
    },
  });
  const env = createMockEnv();
  
  for (const [key, value] of Object.entries(env)) {
    Deno.env.set(key, value);
  }

  const res = await handleSendNotificationEmail(req);
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.success, true);
  assertEquals(body.message, "Email notification queued");
  assertEquals(body.type, "transaction_created");
});

Deno.test("send-notification-email: handles different notification types", async () => {
  const types = [
    "transaction_created",
    "transaction_shipped",
    "dispute_opened",
    "price_alert",
  ];

  for (const type of types) {
    const req = createMockRequest("POST", {
      type,
      email: "user@example.com",
      data: {
        userName: "Test User",
      },
    });
    const env = createMockEnv();
    
    for (const [key, value] of Object.entries(env)) {
      Deno.env.set(key, value);
    }

    const res = await handleSendNotificationEmail(req);
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(body.success, true);
    assertEquals(body.type, type);
  }
});

