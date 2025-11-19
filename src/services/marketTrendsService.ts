import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type PriceHistory = Database["public"]["Tables"]["price_history"]["Row"];
type Slab = Database["public"]["Tables"]["slabs"]["Row"];
type Card = Database["public"]["Tables"]["cards"]["Row"];

export interface PriceTrend {
  slab_id: string;
  card_id: string;
  card_name: string;
  set_name: string;
  grade: string;
  grading_company: string;
  current_price: number;
  previous_price: number;
  price_change: number;
  price_change_percent: number;
  volume: number; // Number of listings
}

export interface MarketTrend {
  card_id: string;
  card_name: string;
  set_name: string;
  current_avg_price: number;
  previous_avg_price: number;
  price_change: number;
  price_change_percent: number;
  volume: number;
  listings_count: number;
}

export interface TrendFilter {
  set_name?: string;
  grading_company_id?: string;
  min_price?: number;
  max_price?: number;
  days?: 7 | 30 | 90 | 180;
}

export const marketTrendsService = {
  /**
   * Get top price gainers (biggest price increases)
   */
  async getTopGainers(limit: number = 20, filter?: TrendFilter): Promise<PriceTrend[]> {
    const days = filter?.days || 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Get slabs with price history
    let query = supabase
      .from("slabs")
      .select(`
        id,
        price,
        grade,
        card_id,
        grading_company_id,
        grading_company:grading_companies(id, name, code),
        card:cards!inner(id, name, set_name)
      `)
      .eq("status", "active")
      .gte("created_at", cutoffDate.toISOString());

    if (filter?.set_name) {
      query = query.eq("card.set_name", filter.set_name);
    }

    if (filter?.grading_company_id) {
      query = query.eq("grading_company_id", filter.grading_company_id);
    }

    if (filter?.min_price) {
      query = query.gte("price", filter.min_price);
    }

    if (filter?.max_price) {
      query = query.lte("price", filter.max_price);
    }

    const { data: slabs, error } = await query;

    if (error || !slabs || slabs.length === 0) {
      return [];
    }

    // Get price history for each slab
    const trends: PriceTrend[] = [];

    for (const slab of slabs) {
      const { data: priceHistory } = await supabase
        .from("price_history")
        .select("price, recorded_at")
        .eq("slab_id", slab.id)
        .gte("recorded_at", cutoffDate.toISOString())
        .order("recorded_at", { ascending: true });

      if (priceHistory && priceHistory.length >= 2) {
        const previousPrice = priceHistory[0].price;
        const currentPrice = slab.price || previousPrice;
        const priceChange = currentPrice - previousPrice;
        const priceChangePercent = (priceChange / previousPrice) * 100;

        if (priceChange > 0) {
          trends.push({
            slab_id: slab.id,
            card_id: (slab.card as any)?.id || slab.card_id,
            card_name: (slab.card as any)?.name || "",
            set_name: (slab.card as any)?.set_name || "",
            grade: slab.grade,
            grading_company: (slab.grading_company as any)?.name || "",
            current_price: currentPrice,
            previous_price: previousPrice,
            price_change: priceChange,
            price_change_percent: priceChangePercent,
            volume: 1,
          });
        }
      }
    }

    // Sort by price change percent and return top results
    return trends
      .sort((a, b) => b.price_change_percent - a.price_change_percent)
      .slice(0, limit);
  },

  /**
   * Get top losers (biggest price decreases)
   */
  async getTopLosers(limit: number = 20, filter?: TrendFilter): Promise<PriceTrend[]> {
    const days = filter?.days || 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Get slabs with price history
    let query = supabase
      .from("slabs")
      .select(`
        id,
        price,
        grade,
        card_id,
        grading_company_id,
        grading_company:grading_companies(id, name, code),
        card:cards!inner(id, name, set_name)
      `)
      .eq("status", "active")
      .gte("created_at", cutoffDate.toISOString());

    if (filter?.set_name) {
      query = query.eq("card.set_name", filter.set_name);
    }

    if (filter?.grading_company_id) {
      query = query.eq("grading_company_id", filter.grading_company_id);
    }

    if (filter?.min_price) {
      query = query.gte("price", filter.min_price);
    }

    if (filter?.max_price) {
      query = query.lte("price", filter.max_price);
    }

    const { data: slabs, error } = await query;

    if (error || !slabs || slabs.length === 0) {
      return [];
    }

    // Get price history for each slab
    const trends: PriceTrend[] = [];

    for (const slab of slabs) {
      const { data: priceHistory } = await supabase
        .from("price_history")
        .select("price, recorded_at")
        .eq("slab_id", slab.id)
        .gte("recorded_at", cutoffDate.toISOString())
        .order("recorded_at", { ascending: true });

      if (priceHistory && priceHistory.length >= 2) {
        const previousPrice = priceHistory[0].price;
        const currentPrice = slab.price || previousPrice;
        const priceChange = currentPrice - previousPrice;
        const priceChangePercent = (priceChange / previousPrice) * 100;

        if (priceChange < 0) {
          trends.push({
            slab_id: slab.id,
            card_id: (slab.card as any)?.id || slab.card_id,
            card_name: (slab.card as any)?.name || "",
            set_name: (slab.card as any)?.set_name || "",
            grade: slab.grade,
            grading_company: (slab.grading_company as any)?.name || "",
            current_price: currentPrice,
            previous_price: previousPrice,
            price_change: priceChange,
            price_change_percent: priceChangePercent,
            volume: 1,
          });
        }
      }
    }

    // Sort by price change percent (most negative first) and return top results
    return trends
      .sort((a, b) => a.price_change_percent - b.price_change_percent)
      .slice(0, limit);
  },

  /**
   * Get market trends by card (aggregated)
   */
  async getMarketTrendsByCard(limit: number = 20, filter?: TrendFilter): Promise<MarketTrend[]> {
    const days = filter?.days || 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Get all active slabs
    let query = supabase
      .from("slabs")
      .select(`
        id,
        price,
        card_id,
        card:cards!inner(id, name, set_name)
      `)
      .eq("status", "active");

    if (filter?.set_name) {
      query = query.eq("card.set_name", filter.set_name);
    }

    if (filter?.grading_company_id) {
      query = query.eq("grading_company_id", filter.grading_company_id);
    }

    if (filter?.min_price) {
      query = query.gte("price", filter.min_price);
    }

    if (filter?.max_price) {
      query = query.lte("price", filter.max_price);
    }

    const { data: slabs, error } = await query;

    if (error || !slabs || slabs.length === 0) {
      return [];
    }

    // Group by card_id
    const cardGroups = new Map<string, {
      card_id: string;
      card_name: string;
      set_name: string;
      current_prices: number[];
      slab_ids: string[];
    }>();

    for (const slab of slabs) {
      const cardId = (slab.card as any)?.id || slab.card_id;
      if (!cardGroups.has(cardId)) {
        cardGroups.set(cardId, {
          card_id: cardId,
          card_name: (slab.card as any)?.name || "",
          set_name: (slab.card as any)?.set_name || "",
          current_prices: [],
          slab_ids: [],
        });
      }

      const group = cardGroups.get(cardId)!;
      if (slab.price) {
        group.current_prices.push(slab.price);
      }
      group.slab_ids.push(slab.id);
    }

    // Calculate trends for each card
    const trends: MarketTrend[] = [];

    for (const [cardId, group] of cardGroups.entries()) {
      // Get price history for all slabs of this card
      const { data: priceHistory } = await supabase
        .from("price_history")
        .select("price, recorded_at, slab_id")
        .in("slab_id", group.slab_ids)
        .gte("recorded_at", cutoffDate.toISOString())
        .order("recorded_at", { ascending: true });

      if (priceHistory && priceHistory.length >= 2) {
        // Group by date and calculate average
        const historyByDate = new Map<string, number[]>();
        for (const entry of priceHistory) {
          const date = new Date(entry.recorded_at || "").toISOString().split("T")[0];
          if (!historyByDate.has(date)) {
            historyByDate.set(date, []);
          }
          historyByDate.get(date)!.push(entry.price);
        }

        const dates = Array.from(historyByDate.keys()).sort();
        if (dates.length >= 2) {
          const firstDate = dates[0];
          const lastDate = dates[dates.length - 1];

          const previousPrices = historyByDate.get(firstDate)!;
          const currentPrices = group.current_prices.length > 0
            ? group.current_prices
            : (historyByDate.get(lastDate) || []);

          const previousAvgPrice = previousPrices.reduce((a, b) => a + b, 0) / previousPrices.length;
          const currentAvgPrice = currentPrices.reduce((a, b) => a + b, 0) / currentPrices.length;
          const priceChange = currentAvgPrice - previousAvgPrice;
          const priceChangePercent = (priceChange / previousAvgPrice) * 100;

          trends.push({
            card_id: cardId,
            card_name: group.card_name,
            set_name: group.set_name,
            current_avg_price: currentAvgPrice,
            previous_avg_price: previousAvgPrice,
            price_change: priceChange,
            price_change_percent: priceChangePercent,
            volume: currentPrices.length,
            listings_count: group.current_prices.length,
          });
        }
      }
    }

    // Sort by absolute price change and return top results
    return trends
      .sort((a, b) => Math.abs(b.price_change_percent) - Math.abs(a.price_change_percent))
      .slice(0, limit);
  },

  /**
   * Get price trend for a specific card
   */
  async getCardTrend(cardId: string, days: number = 30): Promise<PricePoint[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Get all slabs for this card
    const { data: slabs } = await supabase
      .from("slabs")
      .select("id")
      .eq("card_id", cardId)
      .eq("status", "active");

    if (!slabs || slabs.length === 0) {
      return [];
    }

    const slabIds = slabs.map(s => s.id);

    // Get price history for all slabs
    const { data: priceHistory } = await supabase
      .from("price_history")
      .select("price, recorded_at")
      .in("slab_id", slabIds)
      .gte("recorded_at", cutoffDate.toISOString())
      .order("recorded_at", { ascending: true });

    if (!priceHistory || priceHistory.length === 0) {
      return [];
    }

    // Group by date and calculate average price per day
    const historyByDate = new Map<string, number[]>();
    for (const entry of priceHistory) {
      const date = new Date(entry.recorded_at || "").toISOString().split("T")[0];
      if (!historyByDate.has(date)) {
        historyByDate.set(date, []);
      }
      historyByDate.get(date)!.push(entry.price);
    }

    // Calculate average price for each date
    const trend: PricePoint[] = [];
    for (const [date, prices] of historyByDate.entries()) {
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
      trend.push({
        date,
        price: avgPrice,
      });
    }

    return trend.sort((a, b) => a.date.localeCompare(b.date));
  },
};

export interface PricePoint {
  date: string;
  price: number;
}

