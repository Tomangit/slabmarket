import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Review = Database["public"]["Tables"]["reviews"]["Row"];
type ReviewInsert = Database["public"]["Tables"]["reviews"]["Insert"];
type ReviewUpdate = Database["public"]["Tables"]["reviews"]["Update"];

export interface ReviewWithUser extends Review {
  reviewer: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export const reviewService = {
  async getTransactionReviews(transactionId: string) {
    const { data, error } = await supabase
      .from("reviews")
      .select(`
        *,
        reviewer:profiles!reviewer_id(id, full_name, avatar_url)
      `)
      .eq("transaction_id", transactionId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data as ReviewWithUser[]) || [];
  },

  async getUserReviews(userId: string) {
    const { data, error } = await supabase
      .from("reviews")
      .select(`
        *,
        reviewer:profiles!reviewer_id(id, full_name, avatar_url),
        transaction:transactions(id, slab_id, price)
      `)
      .eq("reviewee_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getUserAverageRating(userId: string) {
    const { data, error } = await supabase
      .from("reviews")
      .select("rating")
      .eq("reviewee_id", userId);

    if (error) throw error;

    if (!data || data.length === 0) {
      return { average: 0, count: 0 };
    }

    const sum = data.reduce((acc, review) => acc + review.rating, 0);
    const average = sum / data.length;

    return {
      average: Math.round(average * 10) / 10, // Round to 1 decimal
      count: data.length,
    };
  },

  async createReview(review: ReviewInsert) {
    const { data, error } = await supabase
      .from("reviews")
      .insert(review)
      .select(`
        *,
        reviewer:profiles!reviewer_id(id, full_name, avatar_url)
      `)
      .single();

    if (error) throw error;
    return data as ReviewWithUser;
  },

  async updateReview(id: string, updates: ReviewUpdate) {
    const { data, error } = await supabase
      .from("reviews")
      .update(updates)
      .eq("id", id)
      .select(`
        *,
        reviewer:profiles!reviewer_id(id, full_name, avatar_url)
      `)
      .single();

    if (error) throw error;
    return data as ReviewWithUser;
  },

  async deleteReview(id: string) {
    const { error } = await supabase
      .from("reviews")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return true;
  },

  async canUserReviewTransaction(userId: string, transactionId: string) {
    // Check if user is part of the transaction
    const { data: transaction, error } = await supabase
      .from("transactions")
      .select("buyer_id, seller_id, completed_at")
      .eq("id", transactionId)
      .single();

    if (error || !transaction) return false;

    // Check if transaction is completed
    if (!transaction.completed_at) return false;

    // Check if user is buyer or seller
    const isBuyer = transaction.buyer_id === userId;
    const isSeller = transaction.seller_id === userId;
    if (!isBuyer && !isSeller) return false;

    // Check if user already reviewed
    const { data: existingReview } = await supabase
      .from("reviews")
      .select("id")
      .eq("transaction_id", transactionId)
      .eq("reviewer_id", userId)
      .single();

    return !existingReview;
  },
};

