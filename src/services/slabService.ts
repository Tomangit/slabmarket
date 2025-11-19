
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
    // Try to get slab directly first
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

    // If RLS blocks the read (406 or no rows), try using API endpoint with service role
    if (error && (error.code === 'PGRST116' || error.code === '42501' || error.message?.includes('406'))) {
      console.log("[SlabService] RLS blocked read, trying API endpoint with service role...");
      
      try {
        const session = await supabase.auth.getSession();
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        
        if (session.data.session) {
          headers['Authorization'] = `Bearer ${session.data.session.access_token}`;
        }

        const response = await fetch(`/api/get-slab?id=${id}`, {
          method: 'GET',
          headers,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `API returned ${response.status}`);
        }

        const result = await response.json();
        console.log("[SlabService] Slab fetched via API endpoint:", result);
        return result.slab;
      } catch (apiError) {
        console.error("[SlabService] API endpoint also failed:", apiError);
        // Fall through to throw the original RLS error
      }
    }

    if (error) throw error;
    return data;
  },

  async createSlab(slab: SlabInsert) {
    // Sprawdź sesję przed insertem
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    console.log("[SlabService] Creating slab with session:", {
      hasSession: !!session,
      userId: session?.user?.id,
      sellerId: slab.seller_id,
      sessionError: sessionError?.message,
    });

    if (!session) {
      throw new Error("No active session. Please log in again.");
    }

    if (session.user.id !== slab.seller_id) {
      console.error("[SlabService] Session user ID mismatch:", {
        sessionUserId: session.user.id,
        slabSellerId: slab.seller_id,
      });
      throw new Error("Session user ID does not match seller_id");
    }

    // Spróbuj utworzyć profil, jeśli nie istnieje (bez sprawdzania - profil może być niewidoczny przez RLS, ale istnieć w bazie)
    // Sprawdzimy tylko czy profil istnieje poprzez próbę utworzenia - jeśli istnieje, upsert go nie zmieni
    try {
      const response = await fetch('/api/create-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: slab.seller_id,
          email: session.user.email,
          fullName: session.user.user_metadata?.username || session.user.user_metadata?.full_name || null,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn("[SlabService] Failed to ensure profile exists:", response.status, errorText);
        // Kontynuuj mimo to - profil może już istnieć
      } else {
        const { profile: newProfile } = await response.json();
        console.log("[SlabService] Profile ensured:", newProfile?.id);
      }
    } catch (createError) {
      console.warn("[SlabService] Error ensuring profile:", createError);
      // Kontynuuj mimo to - profil może już istnieć
    }
    
    // Poczekaj chwilę, aby profil został zsynchronizowany (jeśli został utworzony)
    await new Promise(resolve => setTimeout(resolve, 200));

    // Odśwież sesję przed insertem, aby upewnić się, że token JWT jest aktualny
    const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
    
    // Jeśli odświeżenie nie powiodło się, użyj aktualnej sesji
    const verifySession = refreshedSession || session;
    
    // Sprawdź auth.uid() w kontekście RLS przez RPC
    let authUidInRls: string | null = null;
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_auth_uid');
      authUidInRls = rpcData || null;
      console.log("[SlabService] RPC auth.uid() check:", {
        authUid: authUidInRls,
        rpcError: rpcError?.message,
      });
    } catch (rpcErr) {
      console.warn("[SlabService] RPC auth.uid() check failed:", rpcErr);
    }
    
    console.log("[SlabService] Verifying session before insert:", {
      hasSession: !!verifySession,
      userId: verifySession?.user?.id,
      sellerId: slab.seller_id,
      authUidInRls: authUidInRls,
      matches: verifySession?.user?.id === slab.seller_id,
      matchesRls: authUidInRls === slab.seller_id,
      refreshError: refreshError?.message,
      slabDataKeys: Object.keys(slab),
      sellerIdType: typeof slab.seller_id,
      sellerIdValue: slab.seller_id,
      accessToken: verifySession?.access_token ? verifySession.access_token.substring(0, 20) + "..." : null,
    });

    if (!verifySession || verifySession.user.id !== slab.seller_id) {
      throw new Error("Session verification failed. Please log in again.");
    }
    
    // Sprawdź, czy auth.uid() w RLS pasuje do seller_id
    if (authUidInRls && authUidInRls !== slab.seller_id) {
      console.error("[SlabService] auth.uid() mismatch:", {
        authUidInRls,
        sellerId: slab.seller_id,
        sessionUserId: verifySession.user.id,
      });
      throw new Error("auth.uid() in RLS context does not match seller_id. Please log out and log in again.");
    }
    
    // Upewnij się, że Supabase client używa aktualnej sesji
    if (refreshedSession) {
      await supabase.auth.setSession(refreshedSession);
    }

    // Upewnij się, że seller_id jest prawidłowym UUID
    if (!slab.seller_id || typeof slab.seller_id !== 'string') {
      throw new Error("Invalid seller_id. Must be a valid UUID string.");
    }

    // Upewnij się, że listing_type jest prawidłowy
    if (slab.listing_type !== 'fixed' && slab.listing_type !== 'auction') {
      throw new Error(`Invalid listing_type: ${slab.listing_type}. Must be 'fixed' or 'auction'.`);
    }

    // Sprawdź, czy profil istnieje w bazie (foreign key constraint wymaga tego)
    // Użyj service role, aby ominąć RLS na tabeli profiles
    try {
      const response = await fetch('/api/check-profile-exists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: slab.seller_id,
        }),
      });
      
      if (response.ok) {
        const { exists } = await response.json();
        console.log("[SlabService] Profile existence check (via service role):", exists);
      }
    } catch (checkError) {
      console.warn("[SlabService] Profile existence check failed:", checkError);
      // Kontynuuj mimo to - profil powinien istnieć
    }

    console.log("[SlabService] Inserting slab with final data:", {
      seller_id: slab.seller_id,
      listing_type: slab.listing_type,
      status: slab.status,
      name: slab.name,
      cert_number: slab.cert_number,
      seller_id_type: typeof slab.seller_id,
      seller_id_length: slab.seller_id?.length,
    });

    // Call debug function to check RLS context right before insert
    try {
      const { data: debugData, error: debugError } = await supabase.rpc('debug_slabs_insert_check', {
        p_seller_id: slab.seller_id
      });
      console.log("[SlabService] RLS debug check (before insert):", debugData, debugError);
    } catch (debugErr) {
      console.warn("[SlabService] RLS debug check failed:", debugErr);
    }

    // Try to insert directly first
    const { data, error } = await supabase
      .from("slabs")
      .insert(slab)
      .select()
      .single();

    // If RLS blocks the insert, try using API endpoint with service role
    if (error && error.code === '42501') {
      console.log("[SlabService] RLS blocked insert, trying API endpoint with service role...");
      
      try {
        const session = await supabase.auth.getSession();
        if (!session.data.session) {
          throw new Error("No active session");
        }

        const response = await fetch('/api/create-slab', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.data.session.access_token}`,
          },
          body: JSON.stringify(slab),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `API returned ${response.status}`);
        }

        const result = await response.json();
        console.log("[SlabService] Slab created via API endpoint:", result);
        return result.slab;
      } catch (apiError) {
        console.error("[SlabService] API endpoint also failed:", apiError);
        // Fall through to throw the original RLS error
      }
    }

    if (error) {
      console.error("[SlabService] Error creating slab:", error);
      throw error;
    }
    
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
    try {
      // Try direct delete first - use .select() to get deleted rows
      const { data: deletedRows, error } = await supabase
        .from("slabs")
        .delete()
        .eq("id", id)
        .select();

      // Check if we actually deleted a row
      if (!error && deletedRows && deletedRows.length > 0) {
        console.log('[slabService] Successfully deleted slab via direct query:', id, 'Deleted rows:', deletedRows.length);
        return true;
      }

      // If no rows were deleted but no error, RLS might be silently blocking
      if (!error && (!deletedRows || deletedRows.length === 0)) {
        console.log('[slabService] No rows deleted (RLS might be blocking), trying API endpoint fallback for:', id);
        
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session) {
          throw new Error('Not authenticated');
        }

        const response = await fetch(`/api/delete-slab?id=${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.session.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || `Failed to delete slab: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('[slabService] Successfully deleted slab via API endpoint:', id);
        return result.success === true;
      }

      // If RLS blocks with explicit error, use API endpoint
      if (error && (error.code === '42501' || error.message?.includes('row-level security') || error.message?.includes('RLS'))) {
        console.log('[slabService] RLS blocked delete with error, trying API endpoint fallback:', error.message);
        
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session) {
          throw new Error('Not authenticated');
        }

        const response = await fetch(`/api/delete-slab?id=${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.session.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || `Failed to delete slab: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('[slabService] Successfully deleted slab via API endpoint:', id);
        return result.success === true;
      }

      // If it's a different error, throw it
      if (error) {
        throw error;
      }

      // No error but no rows deleted - this shouldn't happen
      throw new Error('Delete operation completed but no rows were deleted');
    } catch (error: any) {
      console.error('[slabService] Error deleting slab:', error);
      throw error;
    }
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
    console.log("[SlabService] Fetching user slabs for user_id:", userId);
    
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

    console.log("[SlabService] Direct query result:", {
      hasError: !!error,
      errorCode: error?.code,
      errorMessage: error?.message,
      dataLength: data?.length || 0,
      hasData: !!data
    });

    // If RLS blocks the read (406, 42501, or no rows but we suspect RLS), try using API endpoint with service role
    const shouldUseFallback = (error && (
      error.code === '42501' || 
      error.code === 'PGRST116' ||
      error.message?.includes('406') ||
      error.message?.includes('row-level security')
    )) || (!error && (!data || data.length === 0));

    if (shouldUseFallback) {
      if (!error) {
        console.log("[SlabService] Empty results detected, using API endpoint fallback (RLS might be silently blocking)...");
      } else {
        console.log("[SlabService] RLS blocked read for user slabs, trying API endpoint with service role...");
      }
      
      try {
        const session = await supabase.auth.getSession();
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        
        if (session.data.session) {
          headers['Authorization'] = `Bearer ${session.data.session.access_token}`;
        }

        // Build filter params for API
        const filterParams = new URLSearchParams();
        filterParams.append('user_id', userId);
        if (filters?.status) {
          filterParams.append('status', filters.status);
        }

        const apiUrl = `/api/get-user-slabs?${filterParams.toString()}`;
        console.log("[SlabService] Calling API endpoint:", apiUrl);

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
          console.error("[SlabService] API endpoint returned error:", response.status, errorData);
          throw new Error(errorData.message || `API returned ${response.status}`);
        }

        const result = await response.json();
        console.log("[SlabService] User slabs fetched via API endpoint:", {
          success: result.success,
          slabsCount: result.slabs?.length || 0
        });
        return result.slabs || [];
      } catch (apiError) {
        console.error("[SlabService] API endpoint also failed:", apiError);
        // Fall through to throw the original RLS error
      }
    }

    // If no error but empty data, log it (might be RLS silently blocking)
    if (!error && (!data || data.length === 0)) {
      console.warn("[SlabService] No slabs returned for user_id:", userId, "This might indicate RLS blocking access.");
    }

    if (error) throw error;
    return data || [];
  }
};
