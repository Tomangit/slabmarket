
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
type TransactionInsert = Database["public"]["Tables"]["transactions"]["Insert"];
type TransactionUpdate = Database["public"]["Tables"]["transactions"]["Update"];

export const transactionService = {
  async createTransaction(transaction: TransactionInsert) {
    const { data, error } = await supabase
      .from("transactions")
      .insert(transaction)
      .select(`
        *,
        slab:slabs(*),
        buyer:profiles!buyer_id(id, full_name, email),
        seller:profiles!seller_id(id, full_name, email)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  async getUserTransactions(userId: string, role: "buyer" | "seller") {
    const column = role === "buyer" ? "buyer_id" : "seller_id";
    
    const { data, error } = await supabase
      .from("transactions")
      .select(`
        *,
        slab:slabs(*),
        buyer:profiles!buyer_id(id, full_name, email, avatar_url),
        seller:profiles!seller_id(id, full_name, email, avatar_url)
      `)
      .eq(column, userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  async getTransactionById(id: string) {
    const { data, error } = await supabase
      .from("transactions")
      .select(`
        *,
        slab:slabs(*, grading_company:grading_company_id(id, name, code)),
        buyer:profiles!buyer_id(id, full_name, email, avatar_url),
        seller:profiles!seller_id(id, full_name, email, avatar_url)
      `)
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  async updateTransaction(id: string, updates: TransactionUpdate) {
    const { data, error } = await supabase
      .from("transactions")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateEscrowStatus(id: string, status: string) {
    const { data, error } = await supabase
      .from("transactions")
      .update({ escrow_status: status })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateShippingStatus(id: string, status: string, trackingNumber?: string) {
    const updates: TransactionUpdate = { shipping_status: status };
    if (trackingNumber) {
      updates.tracking_number = trackingNumber;
    }

    const { data, error } = await supabase
      .from("transactions")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
