
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
    min_price?: number;
    max_price?: number;
    search?: string;
    page?: number;
    pageSize?: number;
    sortBy?: string;
  }) {
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

    let query = supabase
      .from("marketplace_cards")
      .select("*", { count: "exact" });

    // Apply filters first
    if (filters?.category_id) {
      query = query.eq("category_id", filters.category_id);
    }

    if (filters?.set_name) {
      query = query.eq("set_name", filters.set_name);
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
    
    // Apply ordering - handle nulls for total_listings
    if (orderBy === "total_listings") {
      // For popular sorting, we want to sort by total_listings desc, but handle nulls
      // We'll use nullsLast to put cards without listings at the end
      query = query.order(orderBy, { ascending, nullsFirst: false });
    } else {
      query = query.order(orderBy, { ascending });
    }
    
    // Apply pagination last
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

  async getCardById(id: string) {
    const { data, error } = await supabase
      .from("cards")
      .select(`
        *,
        category:categories(id, name, slug)
      `)
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  async getCardListings(cardId: string, filters?: {
    grading_company_id?: string;
    min_grade?: string;
    max_price?: number;
  }) {
    let query = supabase
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

    const { data, error } = await query;

    if (error) throw error;
    return data;
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
    let query = supabase
      .from("cards")
      .select("set_name")
      .order("set_name");

    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    const { data, error } = await query;

    if (error) throw error;

    const setNames = new Set<string>();
    (data ?? []).forEach((d) => {
      if (d.set_name) {
        setNames.add(d.set_name);
      }
    });

    allPokemonSets.forEach((set) => setNames.add(set.name));

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
