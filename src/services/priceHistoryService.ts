
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type PriceHistory = Database["public"]["Tables"]["price_history"]["Row"];

export interface PricePoint {
  date: string;
  price: number;
}

export interface MarketIndex {
  name: string;
  currentValue: number;
  previousValue: number;
  change: number;
  changePercent: number;
  dataPoints: number;
  timeRange: string;
}

export interface MarketIndexFilter {
  gradingCompany?: string;
  grade?: string;
  categoryId?: string;
  cardId?: string;
  minPrice?: number;
  maxPrice?: number;
  days?: number;
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

  /**
   * Calculate market index based on filters
   * Returns average price for matching slabs over time
   */
  async getMarketIndex(filter: MarketIndexFilter): Promise<MarketIndex | null> {
    const days = filter.days || 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Get all slabs matching the filter
    let slabsQuery = supabase
      .from("slabs")
      .select("id")
      .eq("status", "active");

    if (filter.gradingCompany) {
      slabsQuery = slabsQuery.eq("grading_company_id", filter.gradingCompany);
    }

    if (filter.grade) {
      slabsQuery = slabsQuery.eq("grade", filter.grade);
    }

    if (filter.categoryId) {
      slabsQuery = slabsQuery.eq("category_id", filter.categoryId);
    }

    if (filter.cardId) {
      slabsQuery = slabsQuery.eq("card_id", filter.cardId);
    }

    if (filter.minPrice) {
      slabsQuery = slabsQuery.gte("price", filter.minPrice);
    }

    if (filter.maxPrice) {
      slabsQuery = slabsQuery.lte("price", filter.maxPrice);
    }

    const { data: slabs, error: slabsError } = await slabsQuery;

    if (slabsError || !slabs || slabs.length === 0) {
      return null;
    }

    const slabIds = slabs.map(s => s.id);

    // Get price history for these slabs within time range
    const { data: priceHistory, error: historyError } = await supabase
      .from("price_history")
      .select("price, recorded_at, slab_id")
      .in("slab_id", slabIds)
      .gte("recorded_at", cutoffDate.toISOString())
      .order("recorded_at", { ascending: false });

    if (historyError || !priceHistory || priceHistory.length === 0) {
      return null;
    }

    // Group by date and calculate average price per day
    const pricesByDate = new Map<string, number[]>();

    for (const entry of priceHistory) {
      const date = entry.recorded_at ? entry.recorded_at.split("T")[0] : new Date().toISOString().split("T")[0];
      
      if (!pricesByDate.has(date)) {
        pricesByDate.set(date, []);
      }
      pricesByDate.get(date)!.push(entry.price);
    }

    // Calculate average price per day
    const dailyAverages: Array<{ date: string; price: number }> = [];
    
    for (const [date, prices] of pricesByDate.entries()) {
      const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
      dailyAverages.push({ date, price: avgPrice });
    }

    // Sort by date
    dailyAverages.sort((a, b) => a.date.localeCompare(b.date));

    if (dailyAverages.length < 2) {
      return null;
    }

    const currentValue = dailyAverages[dailyAverages.length - 1].price;
    const previousValue = dailyAverages[0].price;
    const change = currentValue - previousValue;
    const changePercent = (change / previousValue) * 100;

    // Create index name based on filters
    const parts: string[] = [];
    if (filter.gradingCompany) parts.push(`Company: ${filter.gradingCompany}`);
    if (filter.grade) parts.push(`Grade: ${filter.grade}`);
    if (filter.categoryId) parts.push(`Category: ${filter.categoryId}`);
    if (!parts.length) parts.push("Market Average");

    const indexName = parts.join(", ");

    return {
      name: indexName,
      currentValue,
      previousValue,
      change,
      changePercent,
      dataPoints: dailyAverages.length,
      timeRange: `${days} days`,
    };
  },

  /**
   * Get PSA 10 Index (average price of PSA 10 slabs)
   */
  async getPSA10Index(categoryId?: string, days: number = 30): Promise<MarketIndex | null> {
    return this.getMarketIndex({
      gradingCompany: "PSA", // Assuming PSA ID
      grade: "10",
      categoryId,
      days,
    });
  },

  /**
   * Get Grade Index (average price for specific grade)
   */
  async getGradeIndex(
    grade: string,
    gradingCompany?: string,
    categoryId?: string,
    days: number = 30
  ): Promise<MarketIndex | null> {
    return this.getMarketIndex({
      grade,
      gradingCompany,
      categoryId,
      days,
    });
  },

  /**
   * Get price trends for a card
   */
  async getCardPriceTrend(
    cardId: string,
    grade?: string,
    days: number = 90
  ): Promise<PricePoint[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Get all slabs for this card
    let slabsQuery = supabase
      .from("slabs")
      .select("id")
      .eq("status", "active")
      .eq("card_id", cardId);

    if (grade) {
      slabsQuery = slabsQuery.eq("grade", grade);
    }

    const { data: slabs, error: slabsError } = await slabsQuery;

    if (slabsError || !slabs || slabs.length === 0) {
      return [];
    }

    const slabIds = slabs.map(s => s.id);

    // Get price history
    const { data: priceHistory, error: historyError } = await supabase
      .from("price_history")
      .select("price, recorded_at")
      .in("slab_id", slabIds)
      .gte("recorded_at", cutoffDate.toISOString())
      .order("recorded_at", { ascending: true });

    if (historyError || !priceHistory) {
      return [];
    }

    // Group by date and calculate average
    const pricesByDate = new Map<string, number[]>();

    for (const entry of priceHistory) {
      const date = entry.recorded_at ? entry.recorded_at.split("T")[0] : new Date().toISOString().split("T")[0];
      
      if (!pricesByDate.has(date)) {
        pricesByDate.set(date, []);
      }
      pricesByDate.get(date)!.push(entry.price);
    }

    // Calculate daily averages
    const trends: PricePoint[] = [];
    
    for (const [date, prices] of pricesByDate.entries()) {
      const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
      trends.push({ date, price: avgPrice });
    }

    // Sort by date
    trends.sort((a, b) => a.date.localeCompare(b.date));

    return trends;
  },
};

