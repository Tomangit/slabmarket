import { supabase } from "@/integrations/supabase/client";

export type WalletTransaction = {
  id: string;
  user_id: string;
  type: "deposit" | "charge" | "refund" | "adjustment";
  amount_cents: number;
  currency: string;
  reference_id?: string | null;
  metadata?: Record<string, any> | null;
  created_at: string;
};

export type WalletAccount = {
  user_id: string;
  balance_cents: number;
  currency: string;
  created_at: string;
  updated_at: string;
};

function toCents(amount: number): number {
  return Math.round(amount * 100);
}

function fromCents(cents: number): number {
  return Math.round((cents / 100) * 100) / 100;
}

export const walletService = {
  async getAccount(userId: string): Promise<WalletAccount | null> {
    const { data, error } = await supabase
      .from("wallet_accounts")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return data as any;
  },

  async getBalance(userId: string): Promise<{ balance: number; currency: string }> {
    const account = await this.getAccount(userId);
    return {
      balance: fromCents(account?.balance_cents || 0),
      currency: account?.currency || "USD",
    };
  },

  // NOTE: This is a demo deposit without a payment gateway.
  // Integrate Stripe/PayPal and call an Edge Function to verify payment before applying tx.
  async deposit(userId: string, amount: number, currency = "USD"): Promise<WalletTransaction> {
    const { data, error } = await supabase.rpc("wallet_apply_tx", {
      p_user_id: userId,
      p_type: "deposit",
      p_amount_cents: toCents(amount),
      p_currency: currency,
      p_reference_id: null,
      p_metadata: {},
    });
    if (error) throw error;
    return data as any;
  },

  async charge(userId: string, amount: number, currency = "USD", referenceId?: string): Promise<WalletTransaction> {
    const { data, error } = await supabase.rpc("wallet_apply_tx", {
      p_user_id: userId,
      p_type: "charge",
      p_amount_cents: -toCents(amount),
      p_currency: currency,
      p_reference_id: referenceId || null,
      p_metadata: {},
    });
    if (error) throw error;
    return data as any;
  },
  // Withdraw funds from wallet (records as 'adjustment' with metadata.kind = 'withdraw')
  async withdraw(userId: string, amount: number, currency = "USD"): Promise<WalletTransaction> {
    const { data, error } = await supabase.rpc("wallet_apply_tx", {
      p_user_id: userId,
      p_type: "adjustment",
      p_amount_cents: -toCents(amount),
      p_currency: currency,
      p_reference_id: null,
      p_metadata: { kind: "withdraw" } as any,
    });
    if (error) throw error;
    return data as any;
  },

  async getTransactions(userId: string, limit = 50): Promise<WalletTransaction[]> {
    const { data, error } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data || []) as any;
  },
};


