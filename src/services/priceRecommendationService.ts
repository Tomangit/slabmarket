import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { priceComparisonService } from "./priceComparisonService";

type Slab = Database["public"]["Tables"]["slabs"]["Row"];

export interface PriceRecommendation {
  recommendedPrice: number;
  currentPrice?: number;
  confidence: "high" | "medium" | "low";
  reasoning: string[];
  marketData: {
    averagePrice: number;
    minPrice: number;
    maxPrice: number;
    medianPrice: number;
    listingCount: number;
    priceRange: {
      lower25: number;
      upper25: number;
    };
  };
  competitiveAdvice: {
    lowestCompetitor: number | null;
    pricePosition: "above" | "at" | "below" | "unknown";
    recommendation: string;
  };
  trend: {
    direction: "up" | "down" | "stable" | "unknown";
    changePercent: number;
    recentSales: number;
  };
}

export const priceRecommendationService = {
  /**
   * Get price recommendation for a slab based on market data
   */
  async getPriceRecommendation(
    slabData: {
      name: string;
      set_name?: string | null;
      grade: string;
      grading_company_id?: string | null;
      currentPrice?: number;
    }
  ): Promise<PriceRecommendation> {
    try {
      // Get market statistics for similar slabs
      const marketStats = await priceComparisonService.getMarketStats(
        slabData.name,
        slabData.set_name || undefined
      );

      // Get similar listings
      let query = supabase
        .from("slabs")
        .select("price, created_at, status")
        .eq("status", "active")
        .eq("name", slabData.name)
        .eq("grade", slabData.grade);

      if (slabData.set_name) {
        query = query.eq("set_name", slabData.set_name);
      }

      if (slabData.grading_company_id) {
        query = query.eq("grading_company_id", slabData.grading_company_id);
      }

      const { data: similarSlabs, error } = await query;

      if (error) throw error;

      // Get recent sales (completed transactions) for similar slabs
      // First get matching slabs, then get their transactions
      let slabQuery = supabase
        .from("slabs")
        .select("id")
        .eq("name", slabData.name)
        .eq("grade", slabData.grade);

      if (slabData.set_name) {
        slabQuery = slabQuery.eq("set_name", slabData.set_name);
      }

      if (slabData.grading_company_id) {
        slabQuery = slabQuery.eq("grading_company_id", slabData.grading_company_id);
      }

      const { data: matchingSlabs } = await slabQuery;

      let recentSales: any[] = [];
      if (matchingSlabs && matchingSlabs.length > 0) {
        const slabIds = matchingSlabs.map((s) => s.id);
        const queryBuilder = supabase.from("transactions") as any;
        const { data: sales } = await queryBuilder
          .select("price, slab_id")
          .eq("status", "completed")
          .in("slab_id", slabIds)
          .order("completed_at", { ascending: false })
          .limit(10);
        
        recentSales = sales || [];
      }

      // Calculate market data
      const prices = (similarSlabs || [])
        .map((s) => s.price || 0)
        .filter((p) => p > 0);

      const salePrices = (recentSales || [])
        .map((t) => t.price || 0)
        .filter((p) => p > 0);

      // Combine listing and sale prices for better analysis
      const allPrices = [...prices, ...salePrices];

      if (allPrices.length === 0) {
        // No market data available
        return {
          recommendedPrice: slabData.currentPrice || 0,
          currentPrice: slabData.currentPrice,
          confidence: "low",
          reasoning: [
            "No market data available for this card and grade",
            "Recommendation based on similar cards or general pricing",
          ],
          marketData: {
            averagePrice: 0,
            minPrice: 0,
            maxPrice: 0,
            medianPrice: 0,
            listingCount: 0,
            priceRange: {
              lower25: 0,
              upper25: 0,
            },
          },
          competitiveAdvice: {
            lowestCompetitor: null,
            pricePosition: "unknown",
            recommendation: "Set a competitive initial price and adjust based on market response",
          },
          trend: {
            direction: "unknown",
            changePercent: 0,
            recentSales: salePrices.length,
          },
        };
      }

      // Calculate statistics
      const sortedPrices = [...allPrices].sort((a, b) => a - b);
      const averagePrice =
        allPrices.reduce((sum, p) => sum + p, 0) / allPrices.length;
      const medianPrice =
        sortedPrices.length % 2 === 0
          ? (sortedPrices[sortedPrices.length / 2 - 1] +
              sortedPrices[sortedPrices.length / 2]) /
            2
          : sortedPrices[Math.floor(sortedPrices.length / 2)];
      const minPrice = Math.min(...allPrices);
      const maxPrice = Math.max(...allPrices);

      // Calculate quartiles
      const lower25Index = Math.floor(sortedPrices.length * 0.25);
      const upper25Index = Math.ceil(sortedPrices.length * 0.75);
      const lower25 = sortedPrices[lower25Index] || minPrice;
      const upper25 = sortedPrices[upper25Index] || maxPrice;

      // Find lowest competitor price
      const lowestCompetitor =
        prices.length > 0 ? Math.min(...prices) : null;

      // Determine price recommendation strategy
      let recommendedPrice: number;
      let confidence: "high" | "medium" | "low" = "medium";
      const reasoning: string[] = [];

      if (allPrices.length >= 5) {
        // Enough data - use median price (more robust than average)
        recommendedPrice = Math.round(medianPrice * 100) / 100;
        confidence = "high";
        reasoning.push(
          `Based on ${allPrices.length} similar listings and sales`,
          `Median market price: $${recommendedPrice.toLocaleString()}`,
          `Price range: $${minPrice.toLocaleString()} - $${maxPrice.toLocaleString()}`,
        );

        // Adjust based on market position
        if (lowestCompetitor && slabData.currentPrice) {
          const priceDiff = slabData.currentPrice - lowestCompetitor;
          const priceDiffPercent = (priceDiff / lowestCompetitor) * 100;

          if (priceDiffPercent > 10) {
            reasoning.push(
              `Your price is ${priceDiffPercent.toFixed(1)}% higher than the lowest competitor`,
              "Consider reducing price to be more competitive",
            );
            recommendedPrice = Math.round(lowestCompetitor * 1.02 * 100) / 100; // 2% above lowest
          } else if (priceDiffPercent < -5) {
            reasoning.push(
              `Your price is ${Math.abs(priceDiffPercent).toFixed(1)}% lower than the lowest competitor`,
              "You're competitively priced",
            );
          } else {
            reasoning.push("Your price is competitive with the market");
          }
        }

        // Recommend price in the lower quartile for faster sales
        if (recommendedPrice > lower25) {
          recommendedPrice = Math.round(lower25 * 1.05 * 100) / 100; // 5% above lower quartile
          reasoning.push(
            "Recommended price optimized for faster sales (lower quartile)",
          );
        }
      } else if (allPrices.length >= 2) {
        // Limited data - use average
        recommendedPrice = Math.round(averagePrice * 100) / 100;
        confidence = "medium";
        reasoning.push(
          `Based on ${allPrices.length} similar listings (limited data)`,
          `Average market price: $${recommendedPrice.toLocaleString()}`,
          "Recommendation has medium confidence",
        );
      } else {
        // Very limited data
        recommendedPrice = Math.round(allPrices[0] * 100) / 100;
        confidence = "low";
        reasoning.push(
          "Very limited market data available",
          "Recommendation based on single comparable listing",
        );
      }

      // Calculate trend
      let trendDirection: "up" | "down" | "stable" | "unknown" = "unknown";
      let changePercent = 0;

      if (salePrices.length >= 2) {
        const recentSales = salePrices.slice(0, Math.min(5, salePrices.length));
        const olderSales = salePrices.slice(
          Math.min(5, salePrices.length),
          Math.min(10, salePrices.length),
        );

        if (olderSales.length > 0) {
          const recentAvg =
            recentSales.reduce((sum, p) => sum + p, 0) / recentSales.length;
          const olderAvg =
            olderSales.reduce((sum, p) => sum + p, 0) / olderSales.length;
          changePercent = ((recentAvg - olderAvg) / olderAvg) * 100;

          if (changePercent > 5) {
            trendDirection = "up";
          } else if (changePercent < -5) {
            trendDirection = "down";
          } else {
            trendDirection = "stable";
          }
        }
      }

      // Add trend reasoning
      if (trendDirection !== "unknown") {
        reasoning.push(
          `Market trend: ${trendDirection} (${changePercent > 0 ? "+" : ""}${changePercent.toFixed(1)}%)`,
        );
        if (trendDirection === "up") {
          reasoning.push("Prices are rising - you may be able to price higher");
        } else if (trendDirection === "down") {
          reasoning.push(
            "Prices are declining - consider pricing competitively",
          );
        }
      }

      // Competitive advice
      let pricePosition: "above" | "at" | "below" | "unknown" = "unknown";
      let competitiveRecommendation = "";

      if (lowestCompetitor && slabData.currentPrice) {
        const diff = slabData.currentPrice - lowestCompetitor;
        const diffPercent = (diff / lowestCompetitor) * 100;

        if (diffPercent > 5) {
          pricePosition = "above";
          competitiveRecommendation =
            "Your price is higher than competitors. Consider reducing to improve visibility.";
        } else if (diffPercent < -5) {
          pricePosition = "below";
          competitiveRecommendation =
            "Your price is lower than competitors. You're well-positioned for fast sale.";
        } else {
          pricePosition = "at";
          competitiveRecommendation =
            "Your price is competitive with the market.";
        }
      } else if (lowestCompetitor) {
        competitiveRecommendation = `Lowest competitor: $${lowestCompetitor.toLocaleString()}. Consider pricing slightly below for competitive advantage.`;
      }

      return {
        recommendedPrice,
        currentPrice: slabData.currentPrice,
        confidence,
        reasoning,
        marketData: {
          averagePrice: Math.round(averagePrice * 100) / 100,
          minPrice,
          maxPrice,
          medianPrice: Math.round(medianPrice * 100) / 100,
          listingCount: prices.length,
          priceRange: {
            lower25: Math.round(lower25 * 100) / 100,
            upper25: Math.round(upper25 * 100) / 100,
          },
        },
        competitiveAdvice: {
          lowestCompetitor: lowestCompetitor
            ? Math.round(lowestCompetitor * 100) / 100
            : null,
          pricePosition,
          recommendation: competitiveRecommendation,
        },
        trend: {
          direction: trendDirection,
          changePercent: Math.round(changePercent * 100) / 100,
          recentSales: salePrices.length,
        },
      };
    } catch (error) {
      console.error("Error getting price recommendation:", error);
      return {
        recommendedPrice: slabData.currentPrice || 0,
        currentPrice: slabData.currentPrice,
        confidence: "low",
        reasoning: [
          "Error analyzing market data",
          "Recommendation not available",
        ],
        marketData: {
          averagePrice: 0,
          minPrice: 0,
          maxPrice: 0,
          medianPrice: 0,
          listingCount: 0,
          priceRange: {
            lower25: 0,
            upper25: 0,
          },
        },
        competitiveAdvice: {
          lowestCompetitor: null,
          pricePosition: "unknown",
          recommendation: "Unable to provide competitive advice",
        },
        trend: {
          direction: "unknown",
          changePercent: 0,
          recentSales: 0,
        },
      };
    }
  },
};

