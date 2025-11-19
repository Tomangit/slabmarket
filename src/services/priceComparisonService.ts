import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Slab = Database["public"]["Tables"]["slabs"]["Row"] & {
  grading_company: { id: string; name: string; code: string } | null;
  seller: { id: string; full_name: string | null; avatar_url: string | null } | null;
};

export interface ComparisonItem {
  id: string;
  name: string;
  set_name: string | null;
  grade: string;
  grading_company: string;
  price: number;
  cert_number: string;
  cert_verified: boolean | null;
  seller_name: string | null;
  images: string[] | null;
  views: number | null;
  watchlist_count: number | null;
  listing_type: string;
  status: string;
  created_at: string | null;
}

export const priceComparisonService = {
  /**
   * Get similar slabs for comparison (same card, different grades)
   */
  async getSimilarSlabsForComparison(
    slabId: string,
    options?: {
      sameCard?: boolean;
      sameGrade?: boolean;
      differentGrades?: boolean;
      limit?: number;
    }
  ): Promise<ComparisonItem[]> {
    try {
      // First, get the base slab
      const { data: baseSlab, error: baseError } = await supabase
        .from("slabs")
        .select(`
          *,
          grading_company:grading_companies(id, name, code),
          seller:profiles(id, full_name, avatar_url)
        `)
        .eq("id", slabId)
        .single();

      if (baseError || !baseSlab) {
        throw new Error("Base slab not found");
      }

      // Build query for similar slabs
      let query = supabase
        .from("slabs")
        .select(`
          *,
          grading_company:grading_companies(id, name, code),
          seller:profiles(id, full_name, avatar_url)
        `)
        .eq("status", "active")
        .neq("id", slabId);

      // Filter by same card if requested
      if (options?.sameCard && baseSlab.card_id) {
        query = query.eq("card_id", baseSlab.card_id);
      } else if (options?.sameCard && baseSlab.name) {
        // If no card_id, match by name and set
        query = query.eq("name", baseSlab.name);
        if (baseSlab.set_name) {
          query = query.eq("set_name", baseSlab.set_name);
        }
      }

      // Filter by grade
      if (options?.sameGrade) {
        query = query.eq("grade", baseSlab.grade);
      } else if (options?.differentGrades) {
        query = query.neq("grade", baseSlab.grade);
      }

      // Order by price ascending to show cheapest first
      query = query.order("price", { ascending: true });

      // Limit results
      const limit = options?.limit || 10;
      query = query.limit(limit);

      const { data: slabs, error } = await query;

      if (error) throw error;

      // Transform to ComparisonItem format
      return (slabs || []).map((slab: any) => ({
        id: slab.id,
        name: slab.name || "",
        set_name: slab.set_name,
        grade: slab.grade || "",
        grading_company: slab.grading_company?.code || slab.grading_company?.name || "Unknown",
        price: slab.price || 0,
        cert_number: slab.cert_number || "",
        cert_verified: slab.cert_verified,
        seller_name: slab.seller?.full_name || null,
        images: slab.images,
        views: slab.views,
        watchlist_count: slab.watchlist_count,
        listing_type: slab.listing_type || "bin",
        status: slab.status || "active",
        created_at: slab.created_at,
      }));
    } catch (error) {
      console.error("Error fetching similar slabs:", error);
      return [];
    }
  },

  /**
   * Compare prices across different grades of the same card
   */
  async compareGrades(
    cardName: string,
    setName?: string,
    options?: {
      gradingCompany?: string;
      limit?: number;
    }
  ): Promise<ComparisonItem[]> {
    try {
      let query = supabase
        .from("slabs")
        .select(`
          *,
          grading_company:grading_companies(id, name, code),
          seller:profiles(id, full_name, avatar_url)
        `)
        .eq("status", "active")
        .eq("name", cardName);

      if (setName) {
        query = query.eq("set_name", setName);
      }

      if (options?.gradingCompany) {
        // Get grading company ID
        const { data: gc } = await supabase
          .from("grading_companies")
          .select("id")
          .or(`code.eq.${options.gradingCompany.toUpperCase()},name.ilike.%${options.gradingCompany}%`)
          .single();

        if (gc) {
          query = query.eq("grading_company_id", gc.id);
        }
      }

      query = query.order("grade", { ascending: false }); // Higher grades first
      query = query.order("price", { ascending: true }); // Then by price

      const limit = options?.limit || 20;
      query = query.limit(limit);

      const { data: slabs, error } = await query;

      if (error) throw error;

      return (slabs || []).map((slab: any) => ({
        id: slab.id,
        name: slab.name || "",
        set_name: slab.set_name,
        grade: slab.grade || "",
        grading_company: slab.grading_company?.code || slab.grading_company?.name || "Unknown",
        price: slab.price || 0,
        cert_number: slab.cert_number || "",
        cert_verified: slab.cert_verified,
        seller_name: slab.seller?.full_name || null,
        images: slab.images,
        views: slab.views,
        watchlist_count: slab.watchlist_count,
        listing_type: slab.listing_type || "bin",
        status: slab.status || "active",
        created_at: slab.created_at,
      }));
    } catch (error) {
      console.error("Error comparing grades:", error);
      return [];
    }
  },

  /**
   * Get market statistics for a card (average price, price range, grade distribution)
   */
  async getMarketStats(
    cardName: string,
    setName?: string
  ): Promise<{
    averagePrice: number;
    minPrice: number;
    maxPrice: number;
    count: number;
    gradeDistribution: Record<string, number>;
    priceByGrade: Record<string, { avg: number; min: number; max: number; count: number }>;
  }> {
    try {
      let query = supabase
        .from("slabs")
        .select("price, grade, grading_company_id")
        .eq("status", "active")
        .eq("name", cardName);

      if (setName) {
        query = query.eq("set_name", setName);
      }

      const { data: slabs, error } = await query;

      if (error) throw error;
      if (!slabs || slabs.length === 0) {
        return {
          averagePrice: 0,
          minPrice: 0,
          maxPrice: 0,
          count: 0,
          gradeDistribution: {},
          priceByGrade: {},
        };
      }

      const prices = slabs.map((s) => s.price || 0).filter((p) => p > 0);
      const averagePrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);

      // Grade distribution
      const gradeDistribution: Record<string, number> = {};
      slabs.forEach((slab) => {
        const grade = slab.grade || "Unknown";
        gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;
      });

      // Price by grade
      const priceByGrade: Record<string, { avg: number; min: number; max: number; count: number }> = {};
      slabs.forEach((slab) => {
        const grade = slab.grade || "Unknown";
        if (!priceByGrade[grade]) {
          priceByGrade[grade] = { avg: 0, min: Infinity, max: 0, count: 0 };
        }
        const price = slab.price || 0;
        if (price > 0) {
          priceByGrade[grade].count++;
          priceByGrade[grade].min = Math.min(priceByGrade[grade].min, price);
          priceByGrade[grade].max = Math.max(priceByGrade[grade].max, price);
        }
      });

      // Calculate averages
      Object.keys(priceByGrade).forEach((grade) => {
        const pricesForGrade = slabs
          .filter((s) => (s.grade || "Unknown") === grade)
          .map((s) => s.price || 0)
          .filter((p) => p > 0);
        if (pricesForGrade.length > 0) {
          priceByGrade[grade].avg =
            pricesForGrade.reduce((sum, p) => sum + p, 0) / pricesForGrade.length;
        }
      });

      return {
        averagePrice: Math.round(averagePrice * 100) / 100,
        minPrice,
        maxPrice,
        count: slabs.length,
        gradeDistribution,
        priceByGrade,
      };
    } catch (error) {
      console.error("Error getting market stats:", error);
      return {
        averagePrice: 0,
        minPrice: 0,
        maxPrice: 0,
        count: 0,
        gradeDistribution: {},
        priceByGrade: {},
      };
    }
  },
};

