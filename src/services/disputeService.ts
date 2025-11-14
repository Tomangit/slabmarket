
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Dispute = Database["public"]["Tables"]["disputes"]["Row"];
type DisputeInsert = Database["public"]["Tables"]["disputes"]["Insert"];
type DisputeUpdate = Database["public"]["Tables"]["disputes"]["Update"];

export interface DisputeWithRelations extends Dispute {
  transaction: {
    id: string;
    buyer_id: string;
    seller_id: string;
    price: number;
    slab_id: string;
    escrow_status: string;
    shipping_status: string;
  } | null;
  created_by: {
    id: string;
    full_name: string | null;
    email: string | null;
  } | null;
  moderator: {
    id: string;
    full_name: string | null;
    email: string | null;
  } | null;
}

export const disputeService = {
  async createDispute(dispute: DisputeInsert) {
    const { data, error } = await supabase
      .from("disputes")
      .insert(dispute)
      .select(`
        *,
        transaction:transactions(id, buyer_id, seller_id, price, slab_id, escrow_status, shipping_status)
      `)
      .single();

    if (error) throw error;
    return data as DisputeWithRelations;
  },

  async getDisputeById(id: string) {
    const { data, error } = await supabase
      .from("disputes")
      .select(`
        *,
        transaction:transactions(id, buyer_id, seller_id, price, slab_id, escrow_status, shipping_status),
        created_by:created_by_id(id, full_name, email),
        moderator:moderator_id(id, full_name, email)
      `)
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as DisputeWithRelations;
  },

  async getUserDisputes(userId: string) {
    const { data, error } = await supabase
      .from("disputes")
      .select(`
        *,
        transaction:transactions(id, buyer_id, seller_id, price, slab_id, escrow_status, shipping_status)
      `)
      .eq("created_by_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data as DisputeWithRelations[]) || [];
  },

  async getAllDisputes(filters?: {
    status?: string;
    priority?: string;
    dispute_type?: string;
  }) {
    let query = supabase
      .from("disputes")
      .select(`
        *,
        transaction:transactions(id, buyer_id, seller_id, price, slab_id, escrow_status, shipping_status),
        created_by:created_by_id(id, full_name, email),
        moderator:moderator_id(id, full_name, email)
      `)
      .order("created_at", { ascending: false });

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    if (filters?.priority) {
      query = query.eq("priority", filters.priority);
    }

    if (filters?.dispute_type) {
      query = query.eq("dispute_type", filters.dispute_type);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data as DisputeWithRelations[]) || [];
  },

  async updateDispute(id: string, updates: DisputeUpdate) {
    const { data, error } = await supabase
      .from("disputes")
      .update(updates)
      .eq("id", id)
      .select(`
        *,
        transaction:transactions(id, buyer_id, seller_id, price, slab_id, escrow_status, shipping_status),
        created_by:created_by_id(id, full_name, email),
        moderator:moderator_id(id, full_name, email)
      `)
      .single();

    if (error) throw error;
    return data as DisputeWithRelations;
  },

  async assignModerator(disputeId: string, moderatorId: string) {
    return this.updateDispute(disputeId, {
      moderator_id: moderatorId,
      status: "under_review",
    });
  },

  async resolveDispute(disputeId: string, resolution: string, resolvedById: string) {
    return this.updateDispute(disputeId, {
      status: "resolved",
      resolution,
      resolved_by_id: resolvedById,
      resolved_at: new Date().toISOString(),
    });
  },

  async closeDispute(disputeId: string) {
    return this.updateDispute(disputeId, {
      status: "closed",
    });
  },
};

