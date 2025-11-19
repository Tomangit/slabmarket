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

    // First, check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();

    // Handle 406 errors and other RLS/permission errors gracefully
    if (profileError) {
      // 406 = Not Acceptable (often RLS/permission issue)
      // PGRST116 = No rows returned
      // 42501 = Insufficient privilege
      // PGRST301 = Permission denied
      if (
        profileError.code === "PGRST116" ||
        profileError.code === "42501" ||
        profileError.code === "PGRST301" ||
        profileError.message?.includes("406") ||
        profileError.message?.includes("Not Acceptable")
      ) {
        console.warn("Profile not found or access denied for user, skipping cart sync:", userId);
        // Don't throw error - cart works locally even without sync
        return;
      }
      // For other errors, log but don't throw
      console.warn("Error checking profile, skipping cart sync:", profileError);
      return;
    }

    if (!profile) {
      console.warn("Profile not found for user, skipping cart sync:", userId);
      // Don't throw error - cart works locally even without sync
      return;
    }

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
      // Log error but don't throw - cart works locally
      console.warn("Failed to sync cart to Supabase:", error);
      // Only throw for critical errors (not RLS/permission issues)
      // 406 = Not Acceptable (often RLS/permission issue)
      if (
        error.code !== "42501" &&
        error.code !== "PGRST301" &&
        !error.message?.includes("406") &&
        !error.message?.includes("Not Acceptable")
      ) {
        throw error;
      }
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

