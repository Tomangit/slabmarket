
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Watchlist = Database["public"]["Tables"]["watchlists"]["Row"];
type WatchlistInsert = Database["public"]["Tables"]["watchlists"]["Insert"];

export const watchlistService = {
  async getUserWatchlist(userId: string) {
    const { data, error } = await supabase
      .from("watchlists")
      .select(`
        *,
        slab:slabs(
          *,
          category:categories(id, name, slug),
          grading_company:grading_companies(id, name, code),
          seller:profiles(id, full_name, avatar_url, email)
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  async addToWatchlist(watchlistItem: WatchlistInsert) {
    const { data, error } = await supabase
      .from("watchlists")
      .insert(watchlistItem)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async removeFromWatchlist(id: string) {
    const { error } = await supabase
      .from("watchlists")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return true;
  },

  async updatePriceAlert(id: string, priceAlert: number) {
    const { data, error } = await supabase
      .from("watchlists")
      .update({ price_alert: priceAlert })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async checkIfWatchlisted(userId: string, slabId: string) {
    const { data, error } = await supabase
      .from("watchlists")
      .select("id")
      .eq("user_id", userId)
      .eq("slab_id", slabId)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  }
};
