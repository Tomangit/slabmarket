import { useEffect, useState } from "react";
import { MainHeader } from "@/components/MainHeader";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { walletService } from "@/services/walletService";

type Tx = {
  id: string;
  type: string;
  amount_cents: number;
  currency: string;
  created_at: string;
};

export default function WalletPage() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [currency, setCurrency] = useState<string>("USD");
  const [amount, setAmount] = useState<string>("25");
  const [loading, setLoading] = useState(false);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [filterType, setFilterType] = useState<string>("all");

  const refresh = async () => {
    if (!user) return;
    const data = await walletService.getBalance(user.id);
    setBalance(data.balance);
    setCurrency(data.currency);
  };

  const loadTxs = async () => {
    if (!user) return;
    const data = await walletService.getTransactions(user.id, 100);
    setTxs(data as any);
  };

  useEffect(() => {
    refresh();
    loadTxs();
  }, [user?.id]);

  const handleDeposit = async () => {
    setLoading(true);
    try {
      if (!user) throw new Error("Not authenticated");
      await walletService.deposit(user.id, parseFloat(amount), currency);
      await refresh();
      await loadTxs();
    } catch (e) {
      console.error(e);
      alert("Deposit failed");
    } finally {
      setLoading(false);
    }
  };

  const handleTestCharge = async () => {
    setLoading(true);
    try {
      if (!user) throw new Error("Not authenticated");
      await walletService.charge(user.id, parseFloat(amount), currency, "TEST");
      await refresh();
      await loadTxs();
    } catch (e) {
      console.error(e);
      alert("Charge failed");
    } finally {
      setLoading(false);
    }
  };
  const handleWithdraw = async () => {
    setLoading(true);
    try {
      if (!user) throw new Error("Not authenticated");
      await walletService.withdraw(user.id, parseFloat(amount), currency);
      await refresh();
      await loadTxs();
    } catch (e) {
      console.error(e);
      alert("Withdraw failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <MainHeader currentPage="wallet" />
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Wallet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-bold">
                {currency} {balance.toFixed(2)}
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="max-w-[200px]"
                />
                <Button onClick={handleDeposit} disabled={loading}>
                  Add funds
                </Button>
                <Button variant="outline" onClick={handleTestCharge} disabled={loading}>
                  Test charge
                </Button>
                <Button variant="secondary" onClick={handleWithdraw} disabled={loading}>
                  Withdraw
                </Button>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Test charge: symuluje płatność portfelem (odejmuje środki). Withdraw: wypłaca środki (MVP – bez faktycznej wypłaty na konto).
              </p>
            </CardContent>
          </Card>
          {/* Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-3">
                <label className="text-sm text-slate-600 dark:text-slate-400">Filter:</label>
                <select
                  className="border rounded px-2 py-1 bg-white dark:bg-slate-900"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="deposit">Deposit</option>
                  <option value="charge">Charge</option>
                  <option value="refund">Refund</option>
                  <option value="adjustment">Adjustment</option>
                </select>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 dark:text-slate-400">
                      <th className="py-2 pr-4">Date</th>
                      <th className="py-2 pr-4">Type</th>
                      <th className="py-2 pr-4">Amount</th>
                      <th className="py-2 pr-4">Currency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {txs
                      .filter((t) => (filterType === "all" ? true : t.type === filterType))
                      .map((t) => (
                        <tr key={t.id} className="border-t border-slate-200 dark:border-slate-800">
                          <td className="py-2 pr-4">{new Date(t.created_at).toLocaleString()}</td>
                          <td className="py-2 pr-4 capitalize">{t.type}</td>
                          <td className={`py-2 pr-4 ${t.amount_cents >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {(t.amount_cents / 100).toFixed(2)}
                          </td>
                          <td className="py-2 pr-4">{t.currency}</td>
                        </tr>
                      ))}
                    {txs.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-slate-500">
                          No transactions yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}


