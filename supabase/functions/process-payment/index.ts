// Edge Function to process payments with escrow
// This is a stub implementation - in production, integrate with Stripe Connect or Mangopay

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PaymentRequest {
  transactionId: string;
  amount: number;
  currency: string;
  buyerId: string;
  sellerId: string;
  description?: string;
}

interface EscrowAccount {
  accountId: string;
  status: "active" | "pending" | "suspended";
  payoutEnabled: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { transactionId, amount, currency, buyerId, sellerId, description } =
      await req.json() as PaymentRequest;

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

    // Get or create seller escrow account
    let sellerAccount: EscrowAccount | null = null;
    
    // Check if seller has escrow account
    const { data: sellerProfile } = await supabase
      .from("profiles")
      .select("stripe_account_id, mangopay_user_id")
      .eq("id", sellerId)
      .single();

    // In production, you would:
    // 1. Check if seller has Stripe Connect account
    // 2. If not, create one via Stripe Connect onboarding
    // 3. Store account ID in seller's profile
    
    // For stub, we'll simulate account creation
    if (!sellerProfile?.stripe_account_id && !sellerProfile?.mangopay_user_id) {
      // Simulate creating escrow account
      const simulatedAccountId = `acct_${sellerId.slice(0, 8)}_${Date.now()}`;
      
      // In production with Stripe Connect:
      // const account = await stripe.accounts.create({
      //   type: 'express',
      //   country: 'US',
      //   email: sellerEmail,
      //   capabilities: {
      //     card_payments: { requested: true },
      //     transfers: { requested: true },
      //   },
      // });
      
      // Update seller profile with account ID
      await supabase
        .from("profiles")
        .update({ stripe_account_id: simulatedAccountId })
        .eq("id", sellerId);

      sellerAccount = {
        accountId: simulatedAccountId,
        status: "active",
        payoutEnabled: true,
      };
    } else {
      sellerAccount = {
        accountId: sellerProfile.stripe_account_id || sellerProfile.mangopay_user_id || "",
        status: "active",
        payoutEnabled: true,
      };
    }

    // Process payment with escrow
    // In production, this would:
    // 1. Create payment intent with Stripe
    // 2. Hold funds in escrow (Stripe Connect or Mangopay)
    // 3. Update transaction escrow_status to "held"
    
    // Stub implementation:
    const paymentIntentId = `pi_${transactionId.slice(0, 8)}_${Date.now()}`;
    const escrowId = `escrow_${transactionId}_${Date.now()}`;

    // Update transaction with payment info
    await supabase
      .from("transactions")
      .update({
        escrow_status: "held",
        // In production, store payment_intent_id, escrow_id
      })
      .eq("id", transactionId);

    // Log payment event (in production, this would be in a payments/escrow table)
    console.log("Payment processed (stub):", {
      transactionId,
      paymentIntentId,
      escrowId,
      amount,
      currency,
      buyerId,
      sellerId,
      sellerAccount: sellerAccount.accountId,
    });

    return new Response(
      JSON.stringify({
        success: true,
        paymentIntentId,
        escrowId,
        escrowStatus: "held",
        message: "Payment processed successfully (stub mode)",
        // In production, return client_secret for Stripe payment confirmation
        // clientSecret: paymentIntent.client_secret,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Payment processing error:", error);
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
});

