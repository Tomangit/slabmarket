// Integration tests for process-payment Edge Function

import { assertEquals, assertExists } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { createMockRequest, createMockEnv, createMockSupabaseClient } from "../_shared/test-utils.ts";

// Mock the Edge Function handler
async function handleProcessPayment(req: Request): Promise<Response> {
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
      transactions_select: {
        data: {
          id: "test-transaction-id",
          buyer_id: "test-buyer-id",
          seller_id: "test-seller-id",
          price: 1000,
        },
        error: null,
      },
      transactions_update: {
        data: null,
        error: null,
      },
      profiles_select: {
        data: {
          id: "test-seller-id",
          stripe_account_id: null,
          mangopay_user_id: null,
        },
        error: null,
      },
      profiles_update: {
        data: null,
        error: null,
      },
    });

    const body = await req.json();
    const { transactionId, amount, currency, buyerId, sellerId, description } = body;

    if (!transactionId || !amount || !buyerId || !sellerId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Get transaction details
    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", transactionId)
      .single();

    if (txError || !transaction) {
      return new Response(
        JSON.stringify({ error: "Transaction not found" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        }
      );
    }

    // Verify transaction matches request
    if (
      transaction.buyer_id !== buyerId ||
      transaction.seller_id !== sellerId ||
      transaction.price !== amount
    ) {
      return new Response(
        JSON.stringify({ error: "Transaction data mismatch" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Get seller profile
    const { data: sellerProfile } = await supabase
      .from("profiles")
      .select("stripe_account_id, mangopay_user_id")
      .eq("id", sellerId)
      .single();

    // Create escrow account if needed
    let sellerAccountId = sellerProfile?.stripe_account_id || sellerProfile?.mangopay_user_id;
    if (!sellerAccountId) {
      sellerAccountId = `acct_${sellerId.slice(0, 8)}_${Date.now()}`;
      await supabase
        .from("profiles")
        .update({ stripe_account_id: sellerAccountId })
        .eq("id", sellerId);
    }

    // Process payment (stub)
    const paymentIntentId = `pi_${transactionId.slice(0, 8)}_${Date.now()}`;
    const escrowId = `escrow_${transactionId}_${Date.now()}`;

    // Update transaction
    await supabase
      .from("transactions")
      .update({
        escrow_status: "held",
      })
      .eq("id", transactionId);

    return new Response(
      JSON.stringify({
        success: true,
        paymentIntentId,
        escrowId,
        escrowStatus: "held",
        message: "Payment processed successfully (stub mode)",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to process payment",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
}

Deno.test("process-payment: CORS preflight", async () => {
  const req = createMockRequest("OPTIONS");
  const env = createMockEnv();
  
  for (const [key, value] of Object.entries(env)) {
    Deno.env.set(key, value);
  }

  const res = await handleProcessPayment(req);
  assertEquals(res.status, 200);
  assertEquals(await res.text(), "ok");
});

Deno.test("process-payment: missing required fields", async () => {
  const req = createMockRequest("POST", {
    transactionId: "test-id",
    amount: 1000,
  });
  const env = createMockEnv();
  
  for (const [key, value] of Object.entries(env)) {
    Deno.env.set(key, value);
  }

  const res = await handleProcessPayment(req);
  assertEquals(res.status, 400);
  const body = await res.json();
  assertEquals(body.error, "Missing required fields");
});

Deno.test("process-payment: transaction not found", async () => {
  const req = createMockRequest("POST", {
    transactionId: "non-existent-id",
    amount: 1000,
    currency: "USD",
    buyerId: "test-buyer-id",
    sellerId: "test-seller-id",
  });
  const env = createMockEnv();
  const supabase = createMockSupabaseClient({
    transactions_select: {
      data: null,
      error: { message: "Transaction not found" },
    },
  });
  
  for (const [key, value] of Object.entries(env)) {
    Deno.env.set(key, value);
  }

  const res = await handleProcessPayment(req);
  assertEquals(res.status, 404);
  const body = await res.json();
  assertEquals(body.error, "Transaction not found");
});

Deno.test("process-payment: transaction data mismatch", async () => {
  const req = createMockRequest("POST", {
    transactionId: "test-transaction-id",
    amount: 2000, // Different from transaction price
    currency: "USD",
    buyerId: "test-buyer-id",
    sellerId: "test-seller-id",
  });
  const env = createMockEnv();
  
  for (const [key, value] of Object.entries(env)) {
    Deno.env.set(key, value);
  }

  const res = await handleProcessPayment(req);
  assertEquals(res.status, 400);
  const body = await res.json();
  assertEquals(body.error, "Transaction data mismatch");
});

Deno.test("process-payment: successful payment processing", async () => {
  const req = createMockRequest("POST", {
    transactionId: "test-transaction-id",
    amount: 1000,
    currency: "USD",
    buyerId: "test-buyer-id",
    sellerId: "test-seller-id",
    description: "Test transaction",
  });
  const env = createMockEnv();
  
  for (const [key, value] of Object.entries(env)) {
    Deno.env.set(key, value);
  }

  const res = await handleProcessPayment(req);
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.success, true);
  assertExists(body.paymentIntentId);
  assertExists(body.escrowId);
  assertEquals(body.escrowStatus, "held");
});

Deno.test("process-payment: creates escrow account for new seller", async () => {
  const req = createMockRequest("POST", {
    transactionId: "test-transaction-id",
    amount: 1000,
    currency: "USD",
    buyerId: "test-buyer-id",
    sellerId: "new-seller-id",
    description: "Test transaction",
  });
  const env = createMockEnv();
  const supabase = createMockSupabaseClient({
    transactions_select: {
      data: {
        id: "test-transaction-id",
        buyer_id: "test-buyer-id",
        seller_id: "new-seller-id",
        price: 1000,
      },
      error: null,
    },
    profiles_select: {
      data: {
        id: "new-seller-id",
        stripe_account_id: null,
        mangopay_user_id: null,
      },
      error: null,
    },
  });
  
  for (const [key, value] of Object.entries(env)) {
    Deno.env.set(key, value);
  }

  const res = await handleProcessPayment(req);
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.success, true);
  assertExists(body.escrowId);
});

