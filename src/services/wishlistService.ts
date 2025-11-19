import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Wishlist = Database["public"]["Tables"]["wishlists"]["Row"];
type WishlistInsert = Database["public"]["Tables"]["wishlists"]["Insert"];
type WishlistUpdate = Database["public"]["Tables"]["wishlists"]["Update"];
type WishlistItem = Database["public"]["Tables"]["wishlist_items"]["Row"];
type WishlistItemInsert = Database["public"]["Tables"]["wishlist_items"]["Insert"];

export interface WishlistWithItems extends Wishlist {
  items_count?: number;
  items?: WishlistItemWithSlab[];
}

export interface WishlistItemWithSlab extends WishlistItem {
  slab?: {
    id: string;
    name: string;
    price: number;
    images?: string[] | null;
    grade: string;
    status: string;
    category?: {
      id: string;
      name: string;
      slug: string;
    };
    grading_company?: {
      id: string;
      name: string;
      code: string;
    };
    seller?: {
      id: string;
      full_name: string;
      avatar_url: string;
      email: string;
    };
  };
}

export const wishlistService = {
  // Get all wishlists for a user
  async getUserWishlists(userId: string): Promise<WishlistWithItems[]> {
    const { data: wishlists, error: wishlistsError } = await supabase
      .from("wishlists")
      .select("*")
      .eq("user_id", userId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (wishlistsError) throw wishlistsError;
    if (!wishlists) return [];

    // Get items count for each wishlist
    const wishlistsWithCounts = await Promise.all(
      wishlists.map(async (wishlist) => {
        const { count, error: countError } = await supabase
          .from("wishlist_items")
          .select("*", { count: "exact", head: true })
          .eq("wishlist_id", wishlist.id);

        if (countError) throw countError;

        return {
          ...wishlist,
          items_count: count || 0,
        };
      })
    );

    return wishlistsWithCounts;
  },

  // Get a single wishlist with items
  async getWishlist(wishlistId: string, userId: string): Promise<WishlistWithItems | null> {
    const { data, error } = await supabase
      .from("wishlists")
      .select(`
        *,
        items:wishlist_items(
          *,
          slab:slabs(
            id,
            name,
            price,
            images,
            grade,
            status,
            category:categories(id, name, slug),
            grading_company:grading_companies(id, name, code),
            seller:profiles(id, full_name, avatar_url, email)
          )
        )
      `)
      .eq("id", wishlistId)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }

    return {
      ...data,
      items_count: data.items?.length || 0,
      items: (data.items || []).map((item: any) => ({
        ...item,
        slab: item.slab,
      })),
    };
  },

  // Get default wishlist for a user
  async getDefaultWishlist(userId: string): Promise<Wishlist | null> {
    const { data, error } = await supabase
      .from("wishlists")
      .select("*")
      .eq("user_id", userId)
      .eq("is_default", true)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // Create a new wishlist
  async createWishlist(wishlist: WishlistInsert): Promise<Wishlist> {
    const { data, error } = await supabase
      .from("wishlists")
      .insert(wishlist)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update a wishlist
  async updateWishlist(wishlistId: string, updates: WishlistUpdate): Promise<Wishlist> {
    const { data, error } = await supabase
      .from("wishlists")
      .update(updates)
      .eq("id", wishlistId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete a wishlist
  async deleteWishlist(wishlistId: string): Promise<void> {
    const { error } = await supabase
      .from("wishlists")
      .delete()
      .eq("id", wishlistId);

    if (error) throw error;
  },

  // Add item to wishlist (supports both card_id and slab_id)
  async addItemToWishlist(item: WishlistItemInsert): Promise<WishlistItem> {
    const { data, error } = await supabase
      .from("wishlist_items")
      .insert(item)
      .select()
      .single();

    if (error) {
      // If item already exists, return the existing item
      if (error.code === "23505") {
        const query = supabase
          .from("wishlist_items")
          .select()
          .eq("wishlist_id", item.wishlist_id);
        
        if (item.card_id) {
          query.eq("card_id", item.card_id);
        } else if (item.slab_id) {
          query.eq("slab_id", item.slab_id);
        }
        
        const { data: existing } = await query.single();
        if (existing) return existing;
      }
      throw error;
    }
    return data;
  },

  // Remove item from wishlist (supports both card_id and slab_id)
  // Overload: can accept either string (slabId for backward compatibility) or object
  async removeItemFromWishlist(
    wishlistId: string, 
    itemId: string | { cardId?: string; slabId?: string }
  ): Promise<void> {
    const query = supabase
      .from("wishlist_items")
      .delete()
      .eq("wishlist_id", wishlistId);
    
    // Backward compatibility: if itemId is a string, treat it as slabId
    if (typeof itemId === "string") {
      query.eq("slab_id", itemId);
    } else if (itemId.cardId) {
      query.eq("card_id", itemId.cardId);
    } else if (itemId.slabId) {
      query.eq("slab_id", itemId.slabId);
    } else {
      throw new Error("Either cardId or slabId must be provided");
    }

    const { error } = await query;
    if (error) throw error;
  },

  // Check if slab is in any wishlist for a user
  async checkIfInWishlist(userId: string, slabId: string): Promise<{ wishlist_id: string; wishlist_name: string }[] | null> {
    const { data, error } = await supabase
      .from("wishlist_items")
      .select(`
        wishlist_id,
        wishlist:wishlists!inner(
          id,
          name,
          user_id
        )
      `)
      .eq("wishlist.user_id", userId)
      .eq("slab_id", slabId);

    if (error) {
      // If error is because of missing relation, return null
      if (error.code === "PGRST116" || error.message?.includes("does not exist")) {
        return null;
      }
      throw error;
    }
    
    if (!data || data.length === 0) return null;
    
    return data.map((item: any) => ({
      wishlist_id: item.wishlist.id,
      wishlist_name: item.wishlist.name,
    }));
  },

  // Check if card is in any wishlist for a user
  async checkIfCardInWishlist(userId: string, cardId: string): Promise<{ wishlist_id: string; wishlist_name: string; min_grade?: string; notify_on_new_listing?: boolean }[] | null> {
    const { data, error } = await supabase
      .from("wishlist_items")
      .select(`
        wishlist_id,
        min_grade,
        notify_on_new_listing,
        wishlist:wishlists!inner(
          id,
          name,
          user_id
        )
      `)
      .eq("wishlist.user_id", userId)
      .eq("card_id", cardId);

    if (error) {
      // If error is because of missing relation, return null
      if (error.code === "PGRST116" || error.message?.includes("does not exist")) {
        return null;
      }
      throw error;
    }
    
    if (!data || data.length === 0) return null;
    
    return data.map((item: any) => ({
      wishlist_id: item.wishlist.id,
      wishlist_name: item.wishlist.name,
      min_grade: item.min_grade,
      notify_on_new_listing: item.notify_on_new_listing,
    }));
  },

  // Search for slabs in wishlists (for marketplace search)
  async searchSlabsInWishlists(userId: string, searchQuery: string): Promise<WishlistItemWithSlab[]> {
    const { data, error } = await supabase
      .from("wishlist_items")
      .select(`
        *,
        wishlist:wishlists!inner(
          id,
          name,
          user_id
        ),
        slab:slabs(
          id,
          name,
          price,
          images,
          grade,
          status,
          category:categories(id, name, slug),
          grading_company:grading_companies(id, name, code),
          seller:profiles(id, full_name, avatar_url, email)
        )
      `)
      .eq("wishlist.user_id", userId)
      .ilike("slab.name", `%${searchQuery}%`)
      .order("created_at", { ascending: false });

    if (error) throw error;
    
    return (data || []).map((item: any) => ({
      ...item,
      slab: item.slab,
    }));
  },

  // Get all slabs in user's wishlists (for marketplace filtering)
  async getAllSlabsInWishlists(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from("wishlist_items")
      .select(`
        slab_id,
        wishlist:wishlists!inner(
          user_id
        )
      `)
      .eq("wishlist.user_id", userId);

    if (error) throw error;
    
    // Get unique slab IDs
    const slabIds = new Set<string>();
    (data || []).forEach((item: any) => {
      if (item.slab_id) slabIds.add(item.slab_id);
    });
    
    return Array.from(slabIds);
  },

  // Create default wishlist for a user if it doesn't exist
  async ensureDefaultWishlist(userId: string): Promise<Wishlist> {
    // Check if default wishlist exists
    const defaultWishlist = await this.getDefaultWishlist(userId);
    if (defaultWishlist) return defaultWishlist;

    // Create default wishlist
    const { data, error } = await supabase
      .from("wishlists")
      .insert({
        user_id: userId,
        name: "My Wishlist",
        description: "Default wishlist",
        is_default: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

