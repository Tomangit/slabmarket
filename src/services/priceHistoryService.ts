
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type PriceHistory = Database["public"]["Tables"]["price_history"]["Row"];

export interface PricePoint {
  date: string;
  price: number;
}

export const priceHistoryService = {
  async getSlabPriceHistory(slabId: string, limit: number = 90): Promise<PricePoint[]> {
    const { data, error } = await supabase
      .from("price_history")
      .select("price, recorded_at")
      .eq("slab_id", slabId)
      .order("recorded_at", { ascending: true })
      .limit(limit);

    if (error) {
      console.error("Error fetching price history:", error);
      return [];
    }

    if (!data) return [];

    return data.map((entry) => ({
      date: entry.recorded_at || new Date().toISOString(),
      price: entry.price,
    }));
  },

  async getPriceChange(slabId: string, days: number = 30): Promise<{
    change: number;
    changePercent: number;
    currentPrice: number;
    previousPrice: number;
  } | null> {
    const { data, error } = await supabase
      .from("price_history")
      .select("price, recorded_at")
      .eq("slab_id", slabId)
      .order("recorded_at", { ascending: false })
      .limit(2);

    if (error || !data || data.length < 2) {
      return null;
    }

    const currentPrice = data[0].price;
    const previousPrice = data[1].price;
    const change = currentPrice - previousPrice;
    const changePercent = (change / previousPrice) * 100;

    return {
      change,
      changePercent,
      currentPrice,
      previousPrice,
    };
  },
};

