import { supabase } from "@/integrations/supabase/client";
import type { CartItem } from "@/contexts/CartContext";
import type { Json } from "@/integrations/supabase/database.types";

const CART_TABLE = "cart_sessions";
const CHECKOUT_TABLE = "checkout_events";

export interface CheckoutPayload {
  userId?: string | null;
  email: string;
  fullName: string;
  shippingAddress: string;
  items: CartItem[];
  total: number;
  paymentMethod: "card" | "bank_transfer" | "crypto";
}

export const cartService = {
  async syncCartItems(userId: string, items: CartItem[]) {
    if (!userId) return;

    const payloadItems = items as unknown as Json;

    const { error } = await supabase.from(CART_TABLE).upsert(
      {
        user_id: userId,
        items: payloadItems,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    if (error) {
      throw error;
    }
  },

  async clearCartItems(userId: string) {
    if (!userId) return;

    const { error } = await supabase
      .from(CART_TABLE)
      .update({ items: [] as unknown as Json, updated_at: new Date().toISOString() })
      .eq("user_id", userId);

    if (error) {
      throw error;
    }
  },

  async recordCheckout(payload: CheckoutPayload) {
    const { error } = await supabase.from(CHECKOUT_TABLE).insert({
      user_id: payload.userId ?? null,
      email: payload.email,
      full_name: payload.fullName,
      shipping_address: payload.shippingAddress,
      items: payload.items as unknown as Json,
      total: payload.total,
      payment_method: payload.paymentMethod,
      status: "stub_confirmed",
      created_at: new Date().toISOString(),
    });

    if (error) {
      throw error;
    }
  },
};

