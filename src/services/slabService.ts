
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Slab = Database["public"]["Tables"]["slabs"]["Row"];
type SlabInsert = Database["public"]["Tables"]["slabs"]["Insert"];
type SlabUpdate = Database["public"]["Tables"]["slabs"]["Update"];

export const slabService = {
  async getAllSlabs(filters?: {
    category_id?: string;
    grading_company_id?: string;
    min_price?: number;
    max_price?: number;
    status?: string;
    first_edition?: boolean;
    shadowless?: boolean;
    pokemon_center_edition?: boolean;
    prerelease?: boolean;
    staff?: boolean;
    tournament_card?: boolean;
    error_card?: boolean;
    min_subgrade?: number;
    grades?: string[];
  }) {
    let query = supabase
      .from("slabs")
      .select(`
        *,
        category:categories(id, name, slug),
        grading_company:grading_companies(id, name, code),
        seller:profiles(id, full_name, avatar_url, email)
      `)
      .eq("status", filters?.status || "active")
      .order("created_at", { ascending: false });

    if (filters?.category_id) {
      query = query.eq("category_id", filters.category_id);
    }

    if (filters?.grading_company_id) {
      query = query.eq("grading_company_id", filters.grading_company_id);
    }

    if (filters?.min_price) {
      query = query.gte("price", filters.min_price);
    }

    if (filters?.max_price) {
      query = query.lte("price", filters.max_price);
    }

    // Edition variant filters
    if (filters?.first_edition !== undefined) {
      query = query.eq("first_edition", filters.first_edition);
    }
    if (filters?.shadowless !== undefined) {
      query = query.eq("shadowless", filters.shadowless);
    }
    if (filters?.pokemon_center_edition !== undefined) {
      query = query.eq("pokemon_center_edition", filters.pokemon_center_edition);
    }
    if (filters?.prerelease !== undefined) {
      query = query.eq("prerelease", filters.prerelease);
    }
    if (filters?.staff !== undefined) {
      query = query.eq("staff", filters.staff);
    }
    if (filters?.tournament_card !== undefined) {
      query = query.eq("tournament_card", filters.tournament_card);
    }
    if (filters?.error_card !== undefined) {
      query = query.eq("error_card", filters.error_card);
    }

    // Grade filter
    if (filters?.grades && filters.grades.length > 0) {
      query = query.in("grade", filters.grades);
    }

    // Minimum subgrade filter (checks all subgrade fields)
    if (filters?.min_subgrade !== undefined) {
      query = query.or(
        `subgrade_centering.gte.${filters.min_subgrade},subgrade_corners.gte.${filters.min_subgrade},subgrade_edges.gte.${filters.min_subgrade},subgrade_surface.gte.${filters.min_subgrade}`
      );
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  },

  async getSlabById(id: string) {
    const { data, error } = await supabase
      .from("slabs")
      .select(`
        *,
        category:categories(id, name, slug),
        grading_company:grading_companies(id, name, code),
        seller:profiles(id, full_name, avatar_url, email)
      `)
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  async createSlab(slab: SlabInsert) {
    const { data, error } = await supabase
      .from("slabs")
      .insert(slab)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateSlab(id: string, updates: SlabUpdate) {
    const { data, error } = await supabase
      .from("slabs")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteSlab(id: string) {
    const { error } = await supabase
      .from("slabs")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return true;
  },

  async incrementViews(id: string) {
    const { error } = await supabase.rpc("increment_slab_views", {
      slab_id_param: id
    });

    if (error) throw error;
    return true;
  },

  async searchSlabs(searchTerm: string) {
    const { data, error } = await supabase
      .from("slabs")
      .select(`
        *,
        category:categories(id, name, slug),
        grading_company:grading_companies(id, name, code),
        seller:profiles(id, full_name, avatar_url, email)
      `)
      .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,cert_number.ilike.%${searchTerm}%`)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get slabs added today
  async getAddedToday(limit: number = 8) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const { data, error } = await supabase
      .from("slabs")
      .select(`
        *,
        category:categories(id, name, slug),
        grading_company:grading_companies(id, name, code),
        seller:profiles(id, full_name, avatar_url, email)
      `)
      .eq("status", "active")
      .gte("created_at", todayISO)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  // Get hot deals (best prices, most popular, or best value)
  async getHotDeals(limit: number = 8, userId?: string) {
    // If user is logged in, personalize based on their preferences
    if (userId) {
      try {
        // Get user's watchlist categories and price preferences
        const { data: watchlist } = await supabase
          .from("watchlists")
          .select(`
            slab_id,
            slabs!inner(category_id, price)
          `)
          .eq("user_id", userId)
          .limit(50);

        // Get user's purchase history to understand price range
        const { data: transactions } = await supabase
          .from("transactions")
          .select(`
            price,
            slabs!inner(category_id)
          `)
          .eq("buyer_id", userId)
          .limit(50);

        // Extract preferred categories from watchlist
        const preferredCategories = new Set<string>();
        const priceRanges: number[] = [];
        
        watchlist?.forEach((item: any) => {
          if (item.slabs?.category_id) {
            preferredCategories.add(item.slabs.category_id);
          }
          if (item.slabs?.price) {
            priceRanges.push(item.slabs.price);
          }
        });

        transactions?.forEach((tx: any) => {
          if (tx.slabs?.category_id) {
            preferredCategories.add(tx.slabs.category_id);
          }
          if (tx.price) {
            priceRanges.push(tx.price);
          }
        });

        // Calculate average price preference
        const avgPrice = priceRanges.length > 0
          ? priceRanges.reduce((a, b) => a + b, 0) / priceRanges.length
          : null;
        const priceRange = avgPrice ? {
          min: avgPrice * 0.5,
          max: avgPrice * 1.5
        } : null;

        // Build personalized query
        let query = supabase
          .from("slabs")
          .select(`
            *,
            category:categories(id, name, slug),
            grading_company:grading_companies(id, name, code),
            seller:profiles(id, full_name, avatar_url, email)
          `)
          .eq("status", "active");

        // Filter by preferred categories if available
        if (preferredCategories.size > 0) {
          query = query.in("category_id", Array.from(preferredCategories));
        }

        // Filter by price range if available
        if (priceRange) {
          query = query
            .gte("price", priceRange.min)
            .lte("price", priceRange.max);
        }

        const { data, error } = await query
          .order("watchlist_count", { ascending: false })
          .order("views", { ascending: false })
          .limit(limit);

        // If personalized results are found, return them
        if (!error && data && data.length > 0) {
          return data;
        }
      } catch (err) {
        console.error("Error getting personalized hot deals:", err);
        // Fall through to default behavior
      }
    }

    // Default: Get slabs with good prices (below average or with high views/watchlist)
    const { data, error } = await supabase
      .from("slabs")
      .select(`
        *,
        category:categories(id, name, slug),
        grading_company:grading_companies(id, name, code),
        seller:profiles(id, full_name, avatar_url, email)
      `)
      .eq("status", "active")
      .order("watchlist_count", { ascending: false })
      .order("views", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  // Get personalized recommendations based on user's activity
  async getPersonalizedRecommendations(userId: string, limit: number = 8) {
    try {
      // Get user's watchlist to understand interests
      const { data: watchlist } = await supabase
        .from("watchlists")
        .select(`
          slab_id,
          slabs!inner(
            category_id,
            grading_company_id,
            grade,
            price,
            first_edition,
            shadowless
          )
        `)
        .eq("user_id", userId)
        .limit(100);

      // Get user's purchase history
      const { data: transactions } = await supabase
        .from("transactions")
        .select(`
          price,
          slabs!inner(
            category_id,
            grading_company_id,
            grade
          )
        `)
        .eq("buyer_id", userId)
        .limit(100);

      // Analyze preferences
      const categoryCounts = new Map<string, number>();
      const gradingCompanyCounts = new Map<string, number>();
      const gradeCounts = new Map<string, number>();
      const priceRanges: number[] = [];
      let prefersFirstEdition = false;
      let prefersShadowless = false;

      watchlist?.forEach((item: any) => {
        const slab = item.slabs;
        if (slab?.category_id) {
          categoryCounts.set(slab.category_id, (categoryCounts.get(slab.category_id) || 0) + 1);
        }
        if (slab?.grading_company_id) {
          gradingCompanyCounts.set(slab.grading_company_id, (gradingCompanyCounts.get(slab.grading_company_id) || 0) + 1);
        }
        if (slab?.grade) {
          gradeCounts.set(slab.grade, (gradeCounts.get(slab.grade) || 0) + 1);
        }
        if (slab?.price) {
          priceRanges.push(slab.price);
        }
        if (slab?.first_edition) prefersFirstEdition = true;
        if (slab?.shadowless) prefersShadowless = true;
      });

      transactions?.forEach((tx: any) => {
        const slab = tx.slabs;
        if (slab?.category_id) {
          categoryCounts.set(slab.category_id, (categoryCounts.get(slab.category_id) || 0) + 2); // Purchases weighted higher
        }
        if (slab?.grading_company_id) {
          gradingCompanyCounts.set(slab.grading_company_id, (gradingCompanyCounts.get(slab.grading_company_id) || 0) + 2);
        }
        if (slab?.grade) {
          gradeCounts.set(slab.grade, (gradeCounts.get(slab.grade) || 0) + 2);
        }
        if (tx.price) {
          priceRanges.push(tx.price);
        }
      });

      // Get top preferences
      const topCategories = Array.from(categoryCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([id]) => id);

      const topGradingCompanies = Array.from(gradingCompanyCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([id]) => id);

      const avgPrice = priceRanges.length > 0
        ? priceRanges.reduce((a, b) => a + b, 0) / priceRanges.length
        : null;

      // Build recommendation query
      let query = supabase
        .from("slabs")
        .select(`
          *,
          category:categories(id, name, slug),
          grading_company:grading_companies(id, name, code),
          seller:profiles(id, full_name, avatar_url, email)
        `)
        .eq("status", "active")
        .not("seller_id", "eq", userId); // Exclude user's own listings

      // Apply filters based on preferences
      if (topCategories.length > 0) {
        query = query.in("category_id", topCategories);
      }

      if (topGradingCompanies.length > 0) {
        query = query.in("grading_company_id", topGradingCompanies);
      }

      if (avgPrice) {
        query = query
          .gte("price", avgPrice * 0.7)
          .lte("price", avgPrice * 1.3);
      }

      if (prefersFirstEdition) {
        query = query.eq("first_edition", true);
      }

      if (prefersShadowless) {
        query = query.eq("shadowless", true);
      }

      const { data, error } = await query
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      // If we have personalized results, return them
      if (data && data.length > 0) {
        return data;
      }

      // Fallback: return recently added slabs in user's preferred categories
      if (topCategories.length > 0) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("slabs")
          .select(`
            *,
            category:categories(id, name, slug),
            grading_company:grading_companies(id, name, code),
            seller:profiles(id, full_name, avatar_url, email)
          `)
          .eq("status", "active")
          .in("category_id", topCategories)
          .not("seller_id", "eq", userId)
          .order("created_at", { ascending: false })
          .limit(limit);

        if (!fallbackError && fallbackData) {
          return fallbackData;
        }
      }
    } catch (err) {
      console.error("Error getting personalized recommendations:", err);
    }

    // Final fallback: return recently added slabs
    const { data, error: fallbackError } = await supabase
      .from("slabs")
      .select(`
        *,
        category:categories(id, name, slug),
        grading_company:grading_companies(id, name, code),
        seller:profiles(id, full_name, avatar_url, email)
      `)
      .eq("status", "active")
      .not("seller_id", "eq", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (fallbackError) throw fallbackError;
    return data || [];
  },

  // Get featured listings
  async getFeatured(limit: number = 8) {
    const { data, error } = await supabase
      .from("slabs")
      .select(`
        *,
        category:categories(id, name, slug),
        grading_company:grading_companies(id, name, code),
        seller:profiles(id, full_name, avatar_url, email)
      `)
      .eq("status", "active")
      .eq("listing_type", "featured")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  // Get user's own slabs (for seller dashboard)
  async getUserSlabs(userId: string, filters?: {
    status?: string;
  }) {
    let query = supabase
      .from("slabs")
      .select(`
        *,
        category:categories(id, name, slug),
        grading_company:grading_companies(id, name, code),
        seller:profiles(id, full_name, avatar_url, email)
      `)
      .eq("seller_id", userId)
      .order("created_at", { ascending: false });

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }
};
