import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { cartService, type CheckoutPayload } from "@/services/cartService";
import { captureException } from "@/lib/sentry";

// Create Supabase client with service role for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

// Calculate fees (stub values - in production these would come from config)
const MARKETPLACE_FEE_RATE = 0.05; // 5%
const PAYMENT_PROCESSING_FEE_RATE = 0.029; // 2.9% + $0.30 per transaction

function calculateFees(price: number) {
  const marketplaceFee = price * MARKETPLACE_FEE_RATE;
  const paymentProcessingFee = price * PAYMENT_PROCESSING_FEE_RATE + 0.30;
  const sellerReceives = price - marketplaceFee - paymentProcessingFee;
  
  return {
    marketplaceFee: Math.round(marketplaceFee * 100) / 100,
    paymentProcessingFee: Math.round(paymentProcessingFee * 100) / 100,
    sellerReceives: Math.round(sellerReceives * 100) / 100,
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { items, total, fullName, email, shippingAddress, paymentMethod, userId, notes, shippingCost } =
    req.body as CheckoutPayload & { notes?: string; shippingCost?: number };

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Cart is empty" });
  }

  if (!fullName || !email || !shippingAddress) {
    return res.status(400).json({ error: "Missing checkout details" });
  }

  if (!userId) {
    return res.status(401).json({ error: "User authentication required" });
  }

  try {
    // Record checkout event
    await cartService.recordCheckout({
      items,
      total,
      fullName,
      email,
      shippingAddress,
      paymentMethod,
      userId,
    });

    // Create transactions for each item
    const transactionIds: string[] = [];
    
    if (!supabase) {
      return res.status(500).json({
        error: "Server configuration error",
        message: "Supabase service role key not configured",
      });
    }

    for (const item of items) {
      try {
        // Extract slab ID from item.id (format: "slab-{id}" or "listing-{id}" or just "{id}")
        const slabId = item.id.replace(/^(slab-|listing-)/, "");
        
        // Get slab details to get seller_id (using service role for server-side access)
        const { data: slab, error: slabError } = await supabase
          .from("slabs")
          .select("id, seller_id, status")
          .eq("id", slabId)
          .single();
        
        if (slabError || !slab || !slab.seller_id) {
          console.warn(`Slab ${slabId} not found or has no seller:`, slabError);
          continue;
        }

        // Check if slab is still available
        if (slab.status !== "active") {
          console.warn(`Slab ${slabId} is not active (status: ${slab.status})`);
          continue;
        }

        // Calculate fees for this item
        const itemTotal = item.price * item.quantity;
        const fees = calculateFees(itemTotal);

        // Create transaction using service role client
        const { data: transaction, error: transactionError } = await supabase
          .from("transactions")
          .insert({
            buyer_id: userId,
            seller_id: slab.seller_id,
            slab_id: slabId,
            price: itemTotal,
            marketplace_fee: fees.marketplaceFee,
            payment_processing_fee: fees.paymentProcessingFee,
            seller_receives: fees.sellerReceives,
            escrow_status: "pending",
            shipping_status: "preparing",
          })
          .select("id")
          .single();

        if (transactionError) {
          console.error(`Error creating transaction for item ${item.id}:`, transactionError);
          continue;
        }

        if (transaction) {
          transactionIds.push(transaction.id);

          // Process payment with escrow (stub)
          try {
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

            if (supabaseUrl && supabaseAnonKey) {
              // Call payment processing Edge Function
              const paymentResponse = await fetch(
                `${supabaseUrl}/functions/v1/process-payment`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${supabaseAnonKey}`,
                  },
                  body: JSON.stringify({
                    transactionId: transaction.id,
                    amount: itemTotal,
                    currency: "USD",
                    buyerId: userId,
                    sellerId: slab.seller_id,
                    description: `Purchase: ${item.name || "Item"}`,
                  }),
                }
              );

              if (!paymentResponse.ok) {
                console.error(
                  `Payment processing failed for transaction ${transaction.id}`
                );
                captureException(
                  new Error(`Payment processing failed for transaction ${transaction.id}`),
                  {
                    userId,
                    transactionId: transaction.id,
                    action: 'payment_processing',
                  }
                );
                // Continue - payment can be retried later
              } else {
                const paymentResult = await paymentResponse.json();
                console.log(
                  `Payment processed for transaction ${transaction.id}:`,
                  paymentResult
                );
              }
            }
          } catch (paymentError) {
            console.error(
              `Error processing payment for transaction ${transaction.id}:`,
              paymentError
            );
            captureException(
              paymentError instanceof Error ? paymentError : new Error(String(paymentError)),
              {
                userId,
                transactionId: transaction.id,
                action: 'payment_processing',
              }
            );
            // Continue - payment can be retried later
          }
        }
      } catch (itemError) {
        console.error(`Error processing item ${item.id}:`, itemError);
        captureException(itemError instanceof Error ? itemError : new Error(String(itemError)), {
          userId,
          itemId: item.id,
          action: 'checkout_item',
        });
        // Continue with other items
      }
    }

    return res.status(200).json({
      status: "ok",
      message: "Checkout completed successfully. Transactions created. Payment processing initiated (stub mode).",
      transactionIds,
      total,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    captureException(error instanceof Error ? error : new Error(String(error)), {
      userId,
      action: 'checkout',
      itemsCount: items?.length || 0,
    });
    return res.status(500).json({
      error: "Failed to process checkout",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

