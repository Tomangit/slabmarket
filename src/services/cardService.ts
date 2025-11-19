
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { allPokemonSets } from "@/data/pokemonSetCatalog";
import { pokemonSetReleaseYears } from "@/data/pokemonSetReleaseYears";

type CardInsert = Database["public"]["Tables"]["cards"]["Insert"];

export interface MarketplaceCard {
  id: string;
  name: string;
  set_name: string;
  card_number: string | null;
  slug: string | null;
  rarity: string | null;
  year: number | null;
  image_url: string | null;
  category_id: string | null;
  category_name: string | null;
  total_listings: number;
  lowest_price: number | null;
  highest_price: number | null;
  average_price: number | null;
  total_sellers: number;
  available_gradings: string[];
}

export const cardService = {
  async getAllMarketplaceCards(filters?: {
    category_id?: string;
    set_name?: string;
    illustrator?: string;
    force_cards?: boolean;
    min_price?: number;
    max_price?: number;
    search?: string;
    cert_number?: string;
    card_number?: string;
    rarity?: string;
    year?: number;
    min_year?: number;
    max_year?: number;
    grading_company_id?: string;
    grades?: string[];
    min_grade?: string;
    max_grade?: string;
    min_subgrade?: number;
    first_edition?: boolean;
    shadowless?: boolean;
    pokemon_center_edition?: boolean;
    prerelease?: boolean;
    staff?: boolean;
    tournament_card?: boolean;
    error_card?: boolean;
    page?: number;
    pageSize?: number;
    sortBy?: string;
  }) {
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 100;
    const offset = (page - 1) * pageSize;
    const isNumberSort = filters?.sortBy === "number-low" || filters?.sortBy === "number-high";

    // Determine sort order
    let orderBy = "name";
    let ascending = true;
    
    if (filters?.sortBy) {
      switch (filters.sortBy) {
        case "name-asc":
          orderBy = "name";
          ascending = true;
          break;
        case "name-desc":
          orderBy = "name";
          ascending = false;
          break;
        case "number-low":
          orderBy = "card_number";
          ascending = true;
          break;
        case "number-high":
          orderBy = "card_number";
          ascending = false;
          break;
        case "price-low":
          orderBy = "lowest_price";
          ascending = true;
          break;
        case "price-high":
          orderBy = "highest_price";
          ascending = false;
          break;
        case "number-low":
          orderBy = "card_number";
          ascending = true;
          break;
        case "number-high":
          orderBy = "card_number";
          ascending = false;
          break;
        case "popular":
          // For popular, we need to handle null values - sort by total_listings desc, but nulls last
          // We'll use a different approach - sort by name as fallback
          orderBy = "total_listings";
          ascending = false;
          break;
        default:
          orderBy = "name";
          ascending = true;
      }
    }

    // Only use cards table if explicitly filtering by illustrator (cards table has description field)
    // Otherwise, always use marketplace_cards view to get price data for sorting
    const useCardsTable = Boolean(filters?.illustrator) && !Boolean(filters?.sortBy?.includes("price"));
    
    console.log("[CardService] getAllMarketplaceCards:", {
      useCardsTable,
      hasIllustrator: Boolean(filters?.illustrator),
      hasForceCards: Boolean(filters?.force_cards),
      sortBy: filters?.sortBy,
      orderBy,
      ascending
    });
    
    let query = useCardsTable
      ? supabase
          .from("cards")
          .select(
            "id, name, set_name, card_number, slug, rarity, year, image_url, category_id, description",
            { count: "exact" },
          )
      : supabase.from("marketplace_cards").select("*", { count: "exact" });

    // Apply filters first
    if (filters?.category_id) {
      query = query.eq("category_id", filters.category_id);
    }

    if (filters?.set_name) {
      query = query.eq("set_name", filters.set_name);
    }

    if (filters?.illustrator) {
      // cards table doesn't have dedicated illustrator column, so filter by description "Illustrator: <name>"
      query = query.ilike("description", `%Illustrator:%${filters.illustrator}%`);
    }

    // Only apply price filters if they're not at default values (0-10000)
    // For min_price > 0: show cards with price >= min_price OR no price
    if (filters?.min_price && filters.min_price > 0) {
      query = query.or(`lowest_price.gte.${filters.min_price},lowest_price.is.null`);
    }

    // For max_price < 10000: show cards with price <= max_price OR no price
    // Note: We don't filter if max_price is 10000 (default)
    if (filters?.max_price && filters.max_price < 10000) {
      query = query.or(`lowest_price.lte.${filters.max_price},lowest_price.is.null`);
    }

    if (filters?.search) {
      query = query.ilike("name", `%${filters.search}%`);
    }

    if (filters?.card_number) {
      query = query.ilike("card_number", `%${filters.card_number}%`);
    }

    if (filters?.rarity) {
      query = query.eq("rarity", filters.rarity);
    }

    if (filters?.year) {
      query = query.eq("year", filters.year);
    }

    if (filters?.min_year) {
      query = query.gte("year", filters.min_year);
    }

    if (filters?.max_year) {
      query = query.lte("year", filters.max_year);
    }

    // Note: cert_number, grading_company_id, grades, and edition variants
    // need to be filtered through slabs, which requires a more complex query
    // For now, we'll add these filters later when we enhance the search
    
    // Apply ordering - handle nulls for total_listings and price columns
    if (orderBy === "total_listings") {
      // For popular sorting, we want to sort by total_listings desc, but handle nulls
      // We'll use nullsLast to put cards without listings at the end
      if (!useCardsTable) {
        query = query.order(orderBy, { ascending, nullsFirst: false });
      }
    } else if (orderBy === "highest_price" || orderBy === "lowest_price") {
      // For price sorting, put cards without prices (no listings) at the end
      if (!useCardsTable) {
        query = query.order(orderBy, { ascending, nullsFirst: false });
      } else {
        // cards table doesn't have price columns; order by name when using cards table
        query = query.order("name", { ascending });
      }
    } else if (!isNumberSort) {
      // cards table doesn't have lowest_price/total_listings; order by name when using cards table
      const ob = useCardsTable ? "name" : orderBy;
      query = query.order(ob, { ascending });
    }
    
    // Apply pagination last
    if (isNumberSort) {
      // For numeric collector number sorting, fetch a larger window and sort client-side
      // Typical set sizes are < 300, so this comfortably covers a full set.
      query = query.range(0, 1000 - 1);
    } else {
    query = query.range(offset, offset + pageSize - 1);
    }

    const { data, error, count } = await query;

    if (!error && (count || 0) > 0) {
      let rows = (data as any[]) || [];
      if (isNumberSort) {
        const dir = filters!.sortBy === "number-high" ? -1 : 1;
        const toNum = (v: any) => {
          if (v == null) return NaN;
          const m = String(v).match(/\d+(\.\d+)?/);
          return m ? parseFloat(m[0]) : NaN;
        };
        rows = [...rows].sort((a: any, b: any) => {
          const an = toNum(a.card_number);
          const bn = toNum(b.card_number);
          if (isNaN(an) && isNaN(bn)) return 0;
          if (isNaN(an)) return 1;
          if (isNaN(bn)) return -1;
          return (an - bn) * dir;
        });
        const sliceStart = offset;
        const sliceEnd = sliceStart + pageSize;
        rows = rows.slice(sliceStart, sliceEnd);
      }
      // Map cards table rows to MarketplaceCard shape if needed
      const mapped = useCardsTable
        ? rows.map((c: any) => ({
            ...c,
            total_listings: 0,
            lowest_price: null,
            highest_price: null,
            average_price: null,
            total_sellers: 0,
            available_gradings: [],
            category_name: null,
          }))
        : (rows as MarketplaceCard[]);
      return {
        cards: mapped,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
      };
    }

    // Fallback: if view returns 0 (e.g., no listings yet), show cards from `cards` table
    let cardsQuery = supabase
      .from("cards")
      .select("id, name, set_name, card_number, slug, rarity, year, image_url, category_id, description", { count: "exact" });

    if (filters?.category_id) cardsQuery = cardsQuery.eq("category_id", filters.category_id);
    if (filters?.set_name) cardsQuery = cardsQuery.eq("set_name", filters.set_name);
    if (filters?.illustrator) cardsQuery = cardsQuery.ilike("description", `%Illustrator:%${filters.illustrator}%`);
    if (filters?.search) cardsQuery = cardsQuery.ilike("name", `%${filters.search}%`);
    if (filters?.card_number) cardsQuery = cardsQuery.ilike("card_number", `%${filters.card_number}%`);
    if (filters?.rarity) cardsQuery = cardsQuery.eq("rarity", filters.rarity);
    if (filters?.year) cardsQuery = cardsQuery.eq("year", filters.year);
    if (filters?.min_year) cardsQuery = cardsQuery.gte("year", filters.min_year);
    if (filters?.max_year) cardsQuery = cardsQuery.lte("year", filters.max_year);

    // Order by name as default
    cardsQuery = cardsQuery.order(orderBy, { ascending });
    cardsQuery = cardsQuery.range(offset, offset + pageSize - 1);

    const { data: cardsData, error: cardsError, count: cardsCount } = await cardsQuery;
    if (cardsError) throw cardsError;

    let fallbackCards: MarketplaceCard[] = (cardsData || []).map((c: any) => ({
      ...c,
      total_listings: 0,
      lowest_price: null,
      highest_price: null,
      average_price: null,
      total_sellers: 0,
      available_gradings: [],
      category_name: null,
    }));

    if (isNumberSort) {
      const dir = filters!.sortBy === "number-high" ? -1 : 1;
      const toNum = (v: any) => {
        if (v == null) return NaN;
        const m = String(v).match(/\d+(\.\d+)?/);
        return m ? parseFloat(m[0]) : NaN;
      };
      fallbackCards = [...fallbackCards].sort((a: any, b: any) => {
        const an = toNum(a.card_number);
        const bn = toNum(b.card_number);
        if (isNaN(an) && isNaN(bn)) return 0;
        if (isNaN(an)) return 1;
        if (isNaN(bn)) return -1;
        return (an - bn) * dir;
      });
      const sliceStart = offset;
      const sliceEnd = sliceStart + pageSize;
      fallbackCards = fallbackCards.slice(sliceStart, sliceEnd);
    }

    return {
      cards: fallbackCards,
      total: cardsCount || 0,
      page,
      pageSize,
      totalPages: Math.ceil((cardsCount || 0) / pageSize),
    };
  },

  async getCardById(id: string) {
    console.log("[cardService] Fetching card by ID:", id);
    
    // Try direct query to cards table first
    let { data, error } = await supabase
      .from("cards")
      .select(`
        *,
        category:categories!cards_category_id_fkey(id, name, slug)
      `)
      .eq("id", id)
      .maybeSingle(); // Use maybeSingle() instead of single() - returns null if not found instead of error

    // If not found in cards table (maybe RLS issue), try marketplace_cards view as fallback
    if (!data && !error) {
      console.log("[cardService] Card not found in cards table, trying marketplace_cards view...");
      
      const { data: viewData, error: viewError } = await supabase
        .from("marketplace_cards")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      
      if (viewError) {
        console.error("[cardService] Error fetching from marketplace_cards view:", viewError);
        error = viewError;
      } else if (viewData) {
        console.log("[cardService] Card found in marketplace_cards view (RLS issue detected). Using view data.");
        // Convert view data to card format (view doesn't have category relation, so we'll fetch it separately)
        const categoryData = viewData.category_id ? await supabase
          .from("categories")
          .select("id, name, slug")
          .eq("id", viewData.category_id)
          .maybeSingle() : { data: null };
        
        // Return card data in the same format as direct query
        data = {
          ...viewData,
          category: categoryData.data || null,
        } as any;
        error = null;
      }
    }

    if (error) {
      console.error("[cardService] Error fetching card by ID:", error);
      // Handle specific Supabase errors
      if (error.code === "PGRST116") {
        throw new Error(`Card not found with ID: ${id}`);
      }
      throw new Error(`Failed to fetch card: ${error.message}`);
    }
    
    if (!data) {
      console.warn("[cardService] Card not found with ID:", id);
      throw new Error(`Card not found with ID: ${id}`);
    }
    
    console.log("[cardService] Card found:", { id: data.id, name: data.name, slug: data.slug });
    return data;
  },

  async getCardBySlug(slug: string) {
    if (!slug) {
      throw new Error("Slug is required");
    }

    console.log("[cardService] Fetching card by slug:", slug);

    // Try direct query to cards table first
    let { data, error } = await supabase
      .from("cards")
      .select(`
        *,
        category:categories!cards_category_id_fkey(id, name, slug)
      `)
      .eq("slug", slug)
      .maybeSingle(); // Use maybeSingle() instead of single() - returns null if not found instead of error

    // If not found in cards table (maybe RLS issue), try marketplace_cards view as fallback
    if (!data && !error) {
      console.log("[cardService] Card not found in cards table, trying marketplace_cards view...");
      
      const queryBuilder = supabase.from("marketplace_cards") as any;
      const { data: viewData, error: viewError } = await queryBuilder
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      
      if (viewError) {
        console.error("[cardService] Error fetching from marketplace_cards view:", viewError);
        error = viewError;
      } else if (viewData) {
        console.log("[cardService] Card found in marketplace_cards view (RLS issue detected). Using view data.");
        // Convert view data to card format (view doesn't have category relation, so we'll fetch it separately)
        const categoryData = viewData.category_id ? await supabase
          .from("categories")
          .select("id, name, slug")
          .eq("id", viewData.category_id)
          .maybeSingle() : { data: null };
        
        // Return card data in the same format as direct query
        data = {
          ...viewData,
          category: categoryData.data || null,
        } as any;
        error = null;
      }
    }

    if (error) {
      console.error("[cardService] Error fetching card by slug:", error);
      // Handle specific Supabase errors
      if (error.code === "PGRST116") {
        throw new Error(`Card not found with slug: ${slug}`);
      }
      throw new Error(`Failed to fetch card: ${error.message}`);
    }
    
    if (!data) {
      console.warn("[cardService] Card not found with slug:", slug);
      throw new Error(`Card not found with slug: ${slug}`);
    }
    
    console.log("[cardService] Card found by slug:", { id: data.id, name: data.name, slug: data.slug });
    return data;
  },

  /**
   * Get card by slug or ID (for backward compatibility)
   * Tries slug first, then falls back to ID if slug not found
   */
  async getCardBySlugOrId(identifier: string) {
    if (!identifier) {
      throw new Error("Card identifier is required");
    }

    // Check if it looks like a UUID (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    
    // If it's a UUID, try ID lookup first
    if (isUUID) {
      try {
        return await this.getCardById(identifier);
      } catch (error: any) {
        // If ID lookup fails, don't try slug (it's definitely a UUID)
        throw error;
      }
    }
    
    // Otherwise, try slug first (most common case)
    try {
      return await this.getCardBySlug(identifier);
    } catch (slugError: any) {
      // If slug lookup fails, try ID as fallback (maybe it's a short ID)
      try {
        return await this.getCardById(identifier);
      } catch (idError: any) {
        // Both failed - throw original slug error with helpful message
        throw new Error(`Card not found with slug or ID: ${identifier}. ${slugError.message}`);
      }
    }
  },

  async getCardListings(cardId: string, filters?: {
    grading_company_id?: string;
    min_grade?: string;
    max_price?: number;
    languages?: string[];
    first_edition?: boolean;
    shadowless?: boolean;
    holo?: boolean;
    reverse_holo?: boolean;
    pokemon_center_edition?: boolean;
    prerelease?: boolean;
    staff?: boolean;
    tournament_card?: boolean;
    error_card?: boolean;
  }) {
    let query: any = supabase
      .from("slabs")
      .select(`
        *,
        grading_company:grading_companies(id, name, code),
        seller:profiles(id, full_name, avatar_url, email)
      `)
      .eq("card_id", cardId)
      .eq("status", "active")
      .order("price", { ascending: true });

    if (filters?.grading_company_id) {
      query = query.eq("grading_company_id", filters.grading_company_id);
    }

    if (filters?.min_grade) {
      query = query.gte("grade", filters.min_grade);
    }

    if (filters?.max_price) {
      query = query.lte("price", filters.max_price);
    }

    if (filters?.languages && filters.languages.length > 0) {
      query = query.in("language", filters.languages);
    }

    if (filters?.first_edition !== undefined) {
      query = query.eq("first_edition", filters.first_edition);
    }

    if (filters?.shadowless !== undefined) {
      query = query.eq("shadowless", filters.shadowless);
    }
    if (filters?.holo !== undefined) {
      query = query.eq("holo", filters.holo);
    }
    if (filters?.reverse_holo !== undefined) {
      query = query.eq("reverse_holo", filters.reverse_holo);
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

    console.log("[CardService] Fetching listings for card_id:", cardId);
    
    // Try direct query first
    const { data, error } = await query;
    
    console.log("[CardService] Direct query result:", {
      hasError: !!error,
      errorCode: error?.code,
      errorMessage: error?.message,
      dataLength: data?.length || 0,
      hasData: !!data
    });

    // If RLS blocks the read (406, 42501, or no rows but we suspect RLS), try using API endpoint with service role
    // ALSO use API endpoint if we get empty results - RLS might be silently blocking
    const shouldUseFallback = (error && (
      error.code === '42501' || 
      error.code === 'PGRST116' ||
      error.message?.includes('406') ||
      error.message?.includes('row-level security')
    )) || (!error && (!data || data.length === 0));

    if (shouldUseFallback) {
      if (!error) {
        console.log("[CardService] Empty results detected, using API endpoint fallback (RLS might be silently blocking)...");
      } else {
        console.log("[CardService] RLS blocked read for card listings, trying API endpoint with service role...");
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
        if (filters?.grading_company_id) filterParams.append('grading_company_id', filters.grading_company_id);
        if (filters?.min_grade) filterParams.append('min_grade', filters.min_grade);
        if (filters?.max_price) filterParams.append('max_price', filters.max_price.toString());
        if (filters?.languages && filters.languages.length > 0) {
          filters.languages.forEach(lang => filterParams.append('languages', lang));
        }
        if (filters?.first_edition !== undefined) filterParams.append('first_edition', filters.first_edition.toString());
        if (filters?.shadowless !== undefined) filterParams.append('shadowless', filters.shadowless.toString());
        if (filters?.holo !== undefined) filterParams.append('holo', filters.holo.toString());
        if (filters?.reverse_holo !== undefined) filterParams.append('reverse_holo', filters.reverse_holo.toString());
        if (filters?.pokemon_center_edition !== undefined) filterParams.append('pokemon_center_edition', filters.pokemon_center_edition.toString());
        if (filters?.prerelease !== undefined) filterParams.append('prerelease', filters.prerelease.toString());
        if (filters?.staff !== undefined) filterParams.append('staff', filters.staff.toString());
        if (filters?.tournament_card !== undefined) filterParams.append('tournament_card', filters.tournament_card.toString());
        if (filters?.error_card !== undefined) filterParams.append('error_card', filters.error_card.toString());

        const apiUrl = `/api/get-card-listings?card_id=${cardId}&${filterParams.toString()}`;
        console.log("[CardService] Calling API endpoint:", apiUrl);

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
          console.error("[CardService] API endpoint returned error:", response.status, errorData);
          throw new Error(errorData.message || `API returned ${response.status}`);
        }

        const result = await response.json();
        console.log("[CardService] Card listings fetched via API endpoint:", {
          success: result.success,
          listingsCount: result.listings?.length || 0
        });
        return result.listings || [];
      } catch (apiError) {
        console.error("[CardService] API endpoint also failed:", apiError);
        // Fall through to throw the original RLS error
      }
    }

    // If no error but empty data, log it (might be RLS silently blocking)
    if (!error && (!data || data.length === 0)) {
      console.warn("[CardService] No listings returned for card_id:", cardId, "This might indicate RLS blocking access.");
    }

    if (error) throw error;
    return data || [];
  },

  // Get available variants for a card
  // First checks existing listings, then applies business logic based on set name
  // Returns an object with boolean flags for each variant that could exist for this card
  async getCardAvailableVariants(cardId: string): Promise<{
    first_edition: boolean;
    shadowless: boolean;
    holo: boolean;
    reverse_holo: boolean;
    pokemon_center_edition: boolean;
    prerelease: boolean;
    staff: boolean;
    tournament_card: boolean;
    error_card: boolean;
    foil: boolean;
  }> {
    // First, get the card details to check set name
    const { data: card, error: cardError } = await supabase
      .from("cards")
      .select("set_name")
      .eq("id", cardId)
      .single();

    if (cardError || !card) {
      console.error("Error fetching card:", cardError);
      return {
        first_edition: false,
        shadowless: false,
        holo: false,
        reverse_holo: false,
        pokemon_center_edition: false,
        prerelease: false,
        staff: false,
        tournament_card: false,
        error_card: false,
        foil: false,
      };
    }

    // 1) Try explicit capabilities cache first (per card)
    try {
      const { data: capsRow } = await supabase
        .from("variant_capabilities")
        .select("first_edition, shadowless, holo, reverse_holo, pokemon_center_edition, prerelease, staff, tournament_card, error_card, foil")
        .eq("card_id", cardId)
        .maybeSingle();
      if (capsRow) {
        return {
          first_edition: !!capsRow.first_edition,
          shadowless: !!capsRow.shadowless,
          holo: !!capsRow.holo,
          reverse_holo: !!capsRow.reverse_holo,
          pokemon_center_edition: !!capsRow.pokemon_center_edition,
          prerelease: !!capsRow.prerelease,
          staff: !!capsRow.staff,
          tournament_card: !!capsRow.tournament_card,
          error_card: !!capsRow.error_card,
          foil: !!capsRow.foil || false,
        };
      }
    } catch (_) {
      // table may not exist yet; fall back below
    }

    // Check which variants exist in existing listings
    const { data: slabs, error: slabsError } = await supabase
      .from("slabs")
      .select("first_edition, shadowless, holo, reverse_holo, pokemon_center_edition, prerelease, staff, tournament_card, error_card, foil")
      .eq("card_id", cardId)
      .eq("status", "active");

    const variants = {
      first_edition: false,
      shadowless: false,
      holo: false,
      reverse_holo: false,
      pokemon_center_edition: false,
      prerelease: false,
      staff: false,
      tournament_card: false,
      error_card: false,
      foil: false,
    };

    // Check existing listings for variants
    if (slabs && slabs.length > 0) {
      slabs.forEach((slab: any) => {
        if (slab.first_edition) variants.first_edition = true;
        if (slab.shadowless) variants.shadowless = true;
        if (slab.holo) variants.holo = true;
        if (slab.reverse_holo) variants.reverse_holo = true;
        if (slab.pokemon_center_edition) variants.pokemon_center_edition = true;
        if (slab.prerelease) variants.prerelease = true;
        if (slab.staff) variants.staff = true;
        if (slab.tournament_card) variants.tournament_card = true;
        if (slab.error_card) variants.error_card = true;
        if (slab.foil) variants.foil = true;
      });
    }

    // Apply business logic: certain sets can have certain variants
    // Base Set and early sets can have first edition and shadowless
    const setName = card.set_name?.toLowerCase() || "";
    const firstEditionSets = [
      "base set",
      "base",
      "jungle",
      "fossil",
      "team rocket",
      "gym heroes",
      "gym challenge",
      "neo genesis",
      "neo discovery",
      "neo revelation",
      "neo destiny",
    ];

    // If set can have first edition, allow it (even if no listings exist yet)
    if (firstEditionSets.some(set => setName.includes(set))) {
      variants.first_edition = true;
      // Base Set specifically can have shadowless
      if (setName.includes("base set") || setName.includes("base")) {
        variants.shadowless = true;
      }
    }

    // Prerelease, Staff, Tournament, and Error cards can exist for any set
    // (these are special variants that can appear in any set)
    variants.prerelease = true;
    variants.staff = true;
    variants.tournament_card = true;
    variants.error_card = true;

    // Pokemon Center Edition is set-specific, but we'll allow it for any set
    // (users can mark it if they have such a variant)
    variants.pokemon_center_edition = true;

    return variants;
  },

  // Get available languages for a card (based on sets that contain this card)
  // This checks which languages the card was released in, not just what's in listings
  async getCardAvailableLanguages(cardId: string): Promise<string[]> {
    // First, get the card details (set_name and number)
    const { data: card, error: cardError } = await supabase
      .from("cards")
      .select("card_number, set_name")
      .eq("id", cardId)
      .single();

    if (cardError || !card) {
      console.error("Card not found:", cardError);
      return [];
    }

    // Try explicit language availability cache first
    const { data: setRow } = await supabase
      .from("sets")
      .select("id")
      .eq("name", card.set_name)
      .maybeSingle();
    let resolvedSetId = setRow?.id;
    if (!resolvedSetId) {
      // Quick alias mapping for common sets (can be expanded or backed by table later)
      const nameToId: Record<string, string> = {
        "Base Set": "base1",
      };
      if (card.set_name && nameToId[card.set_name]) {
        resolvedSetId = nameToId[card.set_name];
      }
    }
    if (resolvedSetId) {
      const { data: langsRows } = await supabase
        .from("set_language_availability")
        .select("language")
        .eq("set_id", resolvedSetId);
      if (langsRows && langsRows.length > 0) {
        return Array.from(new Set(langsRows.map((r: any) => r.language).filter(Boolean)));
      }
    }

    // Map set_name -> set.id (PokemonTCG short id, e.g., base1) and gather all set names in that family
    const { data: baseSet, error: baseErr } = await supabase
      .from("sets")
      .select("id")
      .eq("name", card.set_name)
      .maybeSingle();
    if (baseErr || !baseSet?.id) {
      // Fallback for sets where table keeps only one row per id (can't hold multiple languages)
      // Try simple family mapping for common sets
      const families: Record<string, string[]> = {
        "Base Set": ["Base Set", "Set de Base", "Grundset"],
      };
      const family = families[card.set_name] || families["Base Set"]; // Base Set family as default heuristic
      const { data: variantCards, error: variantsError } = await supabase
        .from("cards")
        .select("set_name")
        .in("set_name", family)
        .eq("card_number", card.card_number || "");
      if (variantsError) return [];
      const setToLang: Record<string, string> = {
        "Base Set": "english",
        "Set de Base": "french",
        "Grundset": "german",
      };
      return Array.from(
        new Set(
          (variantCards || [])
            .map((c: any) => setToLang[c.set_name])
            .filter(Boolean),
        ),
      );
    }
    const baseId = baseSet.id;

    const { data: siblingSets, error: sibErr } = await supabase
      .from("sets")
      .select("name, language")
      .eq("id", baseId);
    if (sibErr) {
      console.error("Error loading sibling sets:", sibErr);
      return [];
    }
    const setNameToLang = new Map<string, string>();
    (siblingSets || []).forEach((s: any) => {
      if (s.name && s.language) setNameToLang.set(s.name, s.language);
    });
    const siblingSetNames = Array.from(setNameToLang.keys());

    if (siblingSetNames.length === 0) return [];

    // Find cards with the same collector number in any of these sibling sets
    const { data: variantCards, error: variantsError } = await supabase
      .from("cards")
      .select("set_name")
      .in("set_name", siblingSetNames)
      .eq("card_number", card.card_number || "");
    if (variantsError) {
      console.error("Error fetching variant cards:", variantsError);
      return [];
    }

    const languages = Array.from(
      new Set(
        (variantCards || [])
          .map((c: any) => setNameToLang.get(c.set_name))
          .filter(Boolean),
      ),
    ) as string[];
    return languages;
  },

  // Get cards that have slabs in user's wishlists
  async getCardsInWishlists(userId: string, filters?: {
    category_id?: string;
    set_name?: string;
    rarity?: string;
    min_price?: number;
    max_price?: number;
    search?: string;
    page?: number;
    pageSize?: number;
    sortBy?: string;
  }) {
    // First, get all slab IDs from user's wishlists
    const { data: wishlistItems, error: wishlistError } = await supabase
      .from("wishlist_items")
      .select(`
        slab_id,
        wishlist:wishlists!inner(
          user_id
        )
      `)
      .eq("wishlist.user_id", userId);

    if (wishlistError) throw wishlistError;

    if (!wishlistItems || wishlistItems.length === 0) {
      return {
        cards: [],
        total: 0,
        page: filters?.page || 1,
        pageSize: filters?.pageSize || 100,
        totalPages: 0,
      };
    }

    // Get unique slab IDs
    const slabIds = Array.from(new Set(wishlistItems.map((item: any) => item.slab_id)));

    // Get slabs with their card information
    const { data: slabs, error: slabsError } = await supabase
      .from("slabs")
      .select(`
        id,
        card_id,
        card:cards!inner(
          id,
          name,
          set_name,
          card_number,
          rarity,
          year,
          image_url,
          category_id,
          category:categories(id, name, slug)
        )
      `)
      .in("id", slabIds)
      .eq("status", "active");

    if (slabsError) throw slabsError;

    if (!slabs || slabs.length === 0) {
      return {
        cards: [],
        total: 0,
        page: filters?.page || 1,
        pageSize: filters?.pageSize || 100,
        totalPages: 0,
      };
    }

    // Get unique card IDs
    const cardIds = Array.from(new Set(slabs.map((slab: any) => slab.card_id).filter(Boolean)));

    if (cardIds.length === 0) {
      return {
        cards: [],
        total: 0,
        page: filters?.page || 1,
        pageSize: filters?.pageSize || 100,
        totalPages: 0,
      };
    }

    // Now get marketplace cards for these card IDs
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 100;
    const offset = (page - 1) * pageSize;

    // Determine sort order
    let orderBy = "name";
    let ascending = true;
    
    if (filters?.sortBy) {
      switch (filters.sortBy) {
        case "name-asc":
          orderBy = "name";
          ascending = true;
          break;
        case "name-desc":
          orderBy = "name";
          ascending = false;
          break;
        case "price-low":
          orderBy = "lowest_price";
          ascending = true;
          break;
        case "price-high":
          orderBy = "lowest_price";
          ascending = false;
          break;
        case "popular":
          orderBy = "total_listings";
          ascending = false;
          break;
        default:
          orderBy = "name";
          ascending = true;
      }
    }

    let query = supabase
      .from("marketplace_cards")
      .select("*", { count: "exact" })
      .in("id", cardIds);

    // Apply filters
    if (filters?.category_id) {
      query = query.eq("category_id", filters.category_id);
    }

    if (filters?.set_name) {
      query = query.eq("set_name", filters.set_name);
    }

    if (filters?.min_price && filters.min_price > 0) {
      query = query.or(`lowest_price.gte.${filters.min_price},lowest_price.is.null`);
    }

    if (filters?.max_price && filters.max_price < 10000) {
      query = query.or(`lowest_price.lte.${filters.max_price},lowest_price.is.null`);
    }

    if (filters?.search) {
      query = query.ilike("name", `%${filters.search}%`);
    }
    
    // Apply ordering
    if (orderBy === "total_listings") {
      query = query.order(orderBy, { ascending, nullsFirst: false });
    } else {
      query = query.order(orderBy, { ascending });
    }
    
    // Apply pagination
    query = query.range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      cards: (data as MarketplaceCard[]) || [],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  },

  async createCard(card: CardInsert) {
    const { data, error } = await supabase
      .from("cards")
      .insert(card)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getSetNames(categoryId?: string) {
    // Use distinct to avoid heavy client-side deduplication
    let query = supabase
      .from("cards")
      .select("set_name", { count: "exact", head: false })
      .not("set_name", "is", null)
      .neq("set_name", "");

    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    const { data, error } = await query;

    if (error) throw error;

    const setNames = new Set<string>();
    const stripVariant = (n: string) => n.replace(/\s+(shadowless|unlimited|1st edition|first edition)$/i, "");
    (data ?? []).forEach((d) => {
      if (d.set_name) {
        setNames.add(stripVariant(d.set_name));
      }
    });

    // Only merge static Pokemon sets when no specific category is requested
    if (!categoryId) {
    allPokemonSets.forEach((set) => {
      const stripVariant = (n: string) => n.replace(/\s+(shadowless|unlimited|1st edition|first edition)$/i, "");
      setNames.add(stripVariant(set.name));
    });
    }

    // For Pokemon, sort by known release year; otherwise, alphabetical
    if (!categoryId || categoryId === "pokemon-tcg") {
    return Array.from(setNames).sort((a, b) => {
      const yearA =
        pokemonSetReleaseYears[`english-${a}`] ??
        pokemonSetReleaseYears[`japanese-${a}`] ??
        0;
      const yearB =
        pokemonSetReleaseYears[`english-${b}`] ??
        pokemonSetReleaseYears[`japanese-${b}`] ??
        0;

      if (yearA !== yearB) {
        return yearB - yearA;
      }
      return a.localeCompare(b);
    });
    }

    return Array.from(setNames).sort((a, b) => a.localeCompare(b));
  },

  async getCardsBySet(setName: string) {
    // Get all possible set name variants (reverse mapping)
    const setNameVariants = [setName];
    
    // Add reverse mappings for known variants
    if (setName === "Nintendo Black Star Promo") {
      setNameVariants.push("Wizards Black Star Promos", "Wizards Black Star Promo", "WBSP");
    }
    
    // Query cards with any of the set name variants
    const { data, error } = await supabase
      .from("cards")
      .select("id, name, card_number, year")
      .in("set_name", setNameVariants)
      .order("card_number")
      .order("name");

    if (error) throw error;
    return data ?? [];
  }
};
