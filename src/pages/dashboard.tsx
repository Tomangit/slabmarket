
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MainHeader } from "@/components/MainHeader";
import { Footer } from "@/components/Footer";
import { Package, Heart, TrendingUp, ShoppingCart, DollarSign, Eye, Edit, Trash2, Sparkles, Download, LayoutGrid, List } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import { slabService } from "@/services/slabService";
import { watchlistService } from "@/services/watchlistService";
import { transactionService } from "@/services/transactionService";
import { formatPrice } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type Slab = Database["public"]["Tables"]["slabs"]["Row"] & {
  category: { id: string; name: string; slug: string } | null;
  grading_company: { id: string; name: string; code: string } | null;
  seller: { id: string; full_name: string | null; avatar_url: string | null; email: string | null } | null;
};

export default function DashboardPage() {
  const t = useTranslations();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [userSlabs, setUserSlabs] = useState<Slab[]>([]);
  const [watchlistItems, setWatchlistItems] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    portfolioValue: 0,
    activeListings: 0,
    watchlistCount: 0,
    totalSales: 0,
    totalPurchases: 0,
    averageSlabValue: 0,
    portfolioGrowth: 0,
  });
  
  const [salesTransactions, setSalesTransactions] = useState<any[]>([]);
  const [portfolioHistory, setPortfolioHistory] = useState<{ date: string; value: number }[]>([]);
  const [listingsView, setListingsView] = useState<"grid" | "list">("list");
  const [listingsStatusFilter, setListingsStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/auth/signin");
        return;
      }
      loadDashboardData();
    }
  }, [user, authLoading]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log("[Dashboard] Loading dashboard data for user:", user.id);
      
      const [slabs, watchlist, purchases, sales] = await Promise.all([
        slabService.getUserSlabs(user.id),
        watchlistService.getUserWatchlist(user.id),
        transactionService.getUserTransactions(user.id, "buyer").catch(() => []),
        transactionService.getUserTransactions(user.id, "seller").catch(() => []),
      ]);

      console.log("[Dashboard] Loaded data:", {
        slabsCount: slabs?.length || 0,
        watchlistCount: watchlist?.length || 0,
        purchasesCount: purchases?.length || 0,
        salesCount: sales?.length || 0,
        slabs: slabs
      });

      setUserSlabs(slabs || []);
      setWatchlistItems(watchlist || []);
      setPurchases(purchases || []);
      setSalesTransactions(sales || []);

      // Calculate stats
      const activeSlabs = slabs?.filter((s: Slab) => s.status === "active") || [];
      const portfolioValue = activeSlabs.reduce((sum: number, slab: Slab) => sum + (slab.price || 0), 0);
      const completedSales = sales?.filter((t: any) => t.status === "completed") || [];
      const totalSales = completedSales.reduce((sum: number, t: any) => sum + (t.price || 0), 0);
      const totalPurchasesValue = (purchases || []).reduce((sum: number, t: any) => sum + (t.price || 0), 0);
      const averageSlabValue = activeSlabs.length > 0 ? portfolioValue / activeSlabs.length : 0;
      
      // Calculate portfolio growth (simplified - compare current value to purchase cost)
      const portfolioGrowth = totalPurchasesValue > 0 
        ? ((portfolioValue - totalPurchasesValue) / totalPurchasesValue) * 100 
        : 0;

      // Generate portfolio history (last 30 days - simplified)
      const history: { date: string; value: number }[] = [];
      const today = new Date();
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        // Simplified: use current portfolio value (in real app, would track historical values)
        history.push({
          date: date.toISOString().split("T")[0],
          value: portfolioValue,
        });
      }
      setPortfolioHistory(history);

      setStats({
        portfolioValue,
        activeListings: activeSlabs.length,
        watchlistCount: watchlist?.length || 0,
        totalSales,
        totalPurchases: totalPurchasesValue,
        averageSlabValue,
        portfolioGrowth,
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPortfolio = async (format: "csv" | "excel") => {
    try {
      // Prepare data for export
      const exportData = {
        portfolio: {
          totalValue: stats.portfolioValue,
          activeListings: stats.activeListings,
          averageValue: stats.averageSlabValue,
          portfolioGrowth: stats.portfolioGrowth,
          totalSales: stats.totalSales,
          totalPurchases: stats.totalPurchases,
        },
        slabs: userSlabs.map((slab: Slab) => ({
          name: slab.name || "N/A",
          set: slab.set_name || "N/A",
          grade: slab.grade || "N/A",
          gradingCompany: slab.grading_company?.name || slab.grading_company?.code || "N/A",
          price: slab.price || 0,
          status: slab.status || "N/A",
          created: slab.created_at ? new Date(slab.created_at).toLocaleDateString() : "N/A",
        })),
        transactions: {
          purchases: purchases.map((tx: any) => ({
            item: tx.slab?.name || "N/A",
            price: tx.price || 0,
            status: tx.status || "N/A",
            date: tx.created_at ? new Date(tx.created_at).toLocaleDateString() : "N/A",
          })),
          sales: salesTransactions.map((tx: any) => ({
            item: tx.slab?.name || "N/A",
            price: tx.price || 0,
            status: tx.status || "N/A",
            date: tx.created_at ? new Date(tx.created_at).toLocaleDateString() : "N/A",
          })),
        },
        watchlist: watchlistItems.map((item: any) => ({
          name: item.slab?.name || "N/A",
          price: item.slab?.price || 0,
          priceAlert: item.price_alert || "N/A",
          added: item.created_at ? new Date(item.created_at).toLocaleDateString() : "N/A",
        })),
      };

      if (format === "csv") {
        // Generate CSV
        let csv = "Portfolio Export\n";
        csv += `Generated: ${new Date().toLocaleString()}\n\n`;

        // Portfolio Summary
        csv += "PORTFOLIO SUMMARY\n";
        csv += "Metric,Value\n";
        csv += `Total Portfolio Value,$${formatPrice(exportData.portfolio.totalValue)}\n`;
        csv += `Active Listings,${exportData.portfolio.activeListings}\n`;
        csv += `Average Slab Value,$${formatPrice(exportData.portfolio.averageValue)}\n`;
        csv += `Portfolio Growth,${exportData.portfolio.portfolioGrowth.toFixed(2)}%\n`;
        csv += `Total Sales,$${formatPrice(exportData.portfolio.totalSales)}\n`;
        csv += `Total Purchases,$${formatPrice(exportData.portfolio.totalPurchases)}\n\n`;

        // Slabs
        csv += "YOUR SLABS\n";
        csv += "Name,Set,Grade,Grading Company,Price,Status,Created\n";
        exportData.slabs.forEach((slab) => {
          csv += `"${slab.name}","${slab.set}","${slab.grade}","${slab.gradingCompany}",$${formatPrice(slab.price)},"${slab.status}","${slab.created}"\n`;
        });
        csv += "\n";

        // Purchases
        csv += "PURCHASES\n";
        csv += "Item,Price,Status,Date\n";
        exportData.transactions.purchases.forEach((tx) => {
          csv += `"${tx.item}",$${formatPrice(tx.price)},"${tx.status}","${tx.date}"\n`;
        });
        csv += "\n";

        // Sales
        csv += "SALES\n";
        csv += "Item,Price,Status,Date\n";
        exportData.transactions.sales.forEach((tx) => {
          csv += `"${tx.item}",$${formatPrice(tx.price)},"${tx.status}","${tx.date}"\n`;
        });
        csv += "\n";

        // Watchlist
        csv += "WATCHLIST\n";
        csv += "Name,Price,Price Alert,Added\n";
        exportData.watchlist.forEach((item) => {
          csv += `"${item.name}",$${formatPrice(item.price)},${item.priceAlert !== "N/A" ? `$${formatPrice(item.priceAlert)}` : "N/A"},"${item.added}"\n`;
        });

        // Download CSV
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `portfolio-export-${new Date().toISOString().split("T")[0]}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (format === "excel") {
        // For Excel, we'll use a simple approach with CSV but with .xlsx extension
        // In production, you'd use a library like 'xlsx' or 'exceljs'
        // For now, we'll create a multi-sheet CSV that Excel can open
        
        // Create a simple Excel-compatible format using HTML table
        const html = `
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #4f46e5; color: white; }
              </style>
            </head>
            <body>
              <h1>Portfolio Export - ${new Date().toLocaleDateString()}</h1>
              
              <h2>Portfolio Summary</h2>
              <table>
                <tr><th>Metric</th><th>Value</th></tr>
                <tr><td>Total Portfolio Value</td><td>$${formatPrice(exportData.portfolio.totalValue)}</td></tr>
                <tr><td>Active Listings</td><td>${exportData.portfolio.activeListings}</td></tr>
                <tr><td>Average Slab Value</td><td>$${formatPrice(exportData.portfolio.averageValue)}</td></tr>
                <tr><td>Portfolio Growth</td><td>${exportData.portfolio.portfolioGrowth.toFixed(2)}%</td></tr>
                <tr><td>Total Sales</td><td>$${formatPrice(exportData.portfolio.totalSales)}</td></tr>
                <tr><td>Total Purchases</td><td>$${formatPrice(exportData.portfolio.totalPurchases)}</td></tr>
              </table>
              
              <h2>Your Slabs</h2>
              <table>
                <tr><th>Name</th><th>Set</th><th>Grade</th><th>Grading Company</th><th>Price</th><th>Status</th><th>Created</th></tr>
                ${exportData.slabs.map(slab => `
                  <tr>
                    <td>${slab.name}</td>
                    <td>${slab.set}</td>
                    <td>${slab.grade}</td>
                    <td>${slab.gradingCompany}</td>
                    <td>$${formatPrice(slab.price)}</td>
                    <td>${slab.status}</td>
                    <td>${slab.created}</td>
                  </tr>
                `).join("")}
              </table>
              
              <h2>Purchases</h2>
              <table>
                <tr><th>Item</th><th>Price</th><th>Status</th><th>Date</th></tr>
                ${exportData.transactions.purchases.map(tx => `
                  <tr>
                    <td>${tx.item}</td>
                    <td>$${formatPrice(tx.price)}</td>
                    <td>${tx.status}</td>
                    <td>${tx.date}</td>
                  </tr>
                `).join("")}
              </table>
              
              <h2>Sales</h2>
              <table>
                <tr><th>Item</th><th>Price</th><th>Status</th><th>Date</th></tr>
                ${exportData.transactions.sales.map(tx => `
                  <tr>
                    <td>${tx.item}</td>
                    <td>$${formatPrice(tx.price)}</td>
                    <td>${tx.status}</td>
                    <td>${tx.date}</td>
                  </tr>
                `).join("")}
              </table>
              
              <h2>Watchlist</h2>
              <table>
                <tr><th>Name</th><th>Price</th><th>Price Alert</th><th>Added</th></tr>
                ${exportData.watchlist.map(item => `
                  <tr>
                    <td>${item.name}</td>
                    <td>$${formatPrice(item.price)}</td>
                    <td>${item.priceAlert !== "N/A" ? `$${formatPrice(item.priceAlert)}` : "N/A"}</td>
                    <td>${item.added}</td>
                  </tr>
                `).join("")}
              </table>
            </body>
          </html>
        `;

        const blob = new Blob([html], { type: "application/vnd.ms-excel" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `portfolio-export-${new Date().toISOString().split("T")[0]}.xls`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("Error exporting portfolio:", error);
      alert("Error exporting portfolio data. Please try again.");
    }
  };

  const handleDeleteSlab = async (slabId: string) => {
    if (!confirm("Are you sure you want to delete this listing?")) return;

    try {
      console.log('[Dashboard] Attempting to delete slab:', slabId);
      await slabService.deleteSlab(slabId);
      console.log('[Dashboard] Successfully deleted slab:', slabId);
      await loadDashboardData();
    } catch (error: any) {
      console.error("[Dashboard] Error deleting slab:", error);
      const errorMessage = error?.message || error?.error || "Unknown error occurred";
      alert(`Failed to delete listing: ${errorMessage}`);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <MainHeader />
        <div className="flex-1 flex items-center justify-center">
          <p>Loading...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <MainHeader currentPage="dashboard" />

      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""}!
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage your listings, track your watchlist, and monitor your portfolio
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
              <DollarSign className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${formatPrice(stats.portfolioValue)}</div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                {userSlabs.filter((s: Slab) => s.status === "active").length} active listings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
              <Package className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeListings}</div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                {userSlabs.filter((s: Slab) => s.status === "sold").length} sold
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Watchlist</CardTitle>
              <Heart className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.watchlistCount}</div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Cards you&apos;re tracking
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <ShoppingCart className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${formatPrice(stats.totalSales)}</div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                {purchases.filter((t: any) => t.status === "completed").length} completed transactions
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="watchlist" className="space-y-6">
          <TabsList>
            <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
            <TabsTrigger value="listings">My Listings</TabsTrigger>
            <TabsTrigger value="purchases">Purchases</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          </TabsList>

          <TabsContent value="watchlist" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Watchlist</CardTitle>
                <CardDescription>Cards you&apos;re tracking and price alerts</CardDescription>
              </CardHeader>
              <CardContent>
                {watchlistItems.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                    <p className="text-slate-600 dark:text-slate-400 mb-4">Your watchlist is empty</p>
                    <Button asChild>
                      <Link href="/marketplace">Browse Marketplace</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {watchlistItems.map((item: any) => {
                      const slab = item.slab;
                      if (!slab) return null;
                      return (
                        <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                          <div className="h-16 w-16 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded overflow-hidden">
                            {slab.images && slab.images.length > 0 ? (
                              <img src={slab.images[0]} alt={slab.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-2xl">🃏</div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">{slab.name}</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {slab.grading_company?.name || slab.grading_company?.code} {slab.grade} • {slab.set_name}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-blue-600">${formatPrice(slab.price)}</p>
                            {item.price_alert && (
                              <p className="text-sm text-green-600">Alert: ${formatPrice(item.price_alert)}</p>
                            )}
                          </div>
                          <Button asChild>
                            <Link href={`/slab/${slab.id}`}>View</Link>
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="listings" className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-bold">Your Listings</h2>
                <p className="text-slate-600 dark:text-slate-400">Manage your active and sold listings</p>
              </div>
              <div className="flex gap-2">
                <Button asChild variant="outline">
                  <Link href="/dashboard/bulk">
                    <Download className="h-4 w-4 mr-2" />
                    Bulk Tools
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/sell">
                    <Package className="h-4 w-4 mr-2" />
                    New Listing
                  </Link>
                </Button>
              </div>
            </div>

            {/* Filters and View Toggle */}
            {userSlabs.length > 0 && (
              <div className="flex justify-between items-center gap-4 flex-wrap">
                <div className="flex gap-2">
                  <Button
                    variant={listingsStatusFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setListingsStatusFilter("all")}
                  >
                    All ({userSlabs.length})
                  </Button>
                  <Button
                    variant={listingsStatusFilter === "active" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setListingsStatusFilter("active")}
                  >
                    Active ({userSlabs.filter((s: Slab) => s.status === "active").length})
                  </Button>
                  <Button
                    variant={listingsStatusFilter === "sold" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setListingsStatusFilter("sold")}
                  >
                    Sold ({userSlabs.filter((s: Slab) => s.status === "sold").length})
                  </Button>
                </div>
                <div className="flex gap-2 border rounded-lg p-1">
                  <Button
                    variant={listingsView === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setListingsView("grid")}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={listingsView === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setListingsView("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {userSlabs.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Package className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                  <p className="text-slate-600 dark:text-slate-400 mb-4">You don&apos;t have any listings yet</p>
                  <Button asChild>
                    <Link href="/sell">Create Your First Listing</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {listingsView === "grid" ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(listingsStatusFilter === "all" ? userSlabs : userSlabs.filter((s: Slab) => s.status === listingsStatusFilter)).map((slab) => (
                  <Card key={slab.id}>
                    <CardHeader className="p-0">
                      <div className="relative aspect-[3/4] bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-t-lg overflow-hidden">
                        {slab.images && slab.images.length > 0 ? (
                          <img src={slab.images[0]} alt={slab.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-6xl">🃏</div>
                        )}
                        <div className="absolute top-2 right-2 flex gap-2">
                          {slab.listing_type === "featured" && (
                            <Badge className="bg-yellow-600">
                              <Sparkles className="h-3 w-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                          <Badge className={slab.status === "active" ? "bg-green-600" : slab.status === "sold" ? "bg-blue-600" : "bg-slate-600"}>
                            {slab.status}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2 line-clamp-1">{slab.name}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                        {slab.grading_company?.name || slab.grading_company?.code} {slab.grade} • {slab.set_name}
                      </p>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xl font-bold text-blue-600">${formatPrice(slab.price)}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mb-3">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {slab.views || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {slab.watchlist_count || 0}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => router.push(`/sell?edit=${slab.id}`)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button size="sm" className="flex-1" asChild>
                          <Link href={`/slab/${slab.id}`}>View</Link>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteSlab(slab.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
                ) : (
                  <div className="space-y-4">
                    {(listingsStatusFilter === "all" ? userSlabs : userSlabs.filter((s: Slab) => s.status === listingsStatusFilter)).map((slab) => (
                      <Card key={slab.id} className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row gap-6">
                            {/* Image */}
                            <div className="relative h-32 w-32 md:h-40 md:w-40 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-lg overflow-hidden flex-shrink-0">
                              {slab.images && slab.images.length > 0 ? (
                                <img src={slab.images[0]} alt={slab.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-4xl">🃏</div>
                              )}
                              <div className="absolute top-2 right-2 flex gap-1 flex-col">
                                {slab.listing_type === "featured" && (
                                  <Badge className="bg-yellow-600 text-xs">
                                    <Sparkles className="h-2 w-2 mr-1" />
                                    Featured
                                  </Badge>
                                )}
                                <Badge className={slab.status === "active" ? "bg-green-600" : slab.status === "sold" ? "bg-blue-600" : "bg-slate-600"} variant="outline">
                                  {slab.status}
                                </Badge>
                              </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 space-y-3">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <h3 className="text-lg font-semibold mb-1">{slab.name}</h3>
                                  <p className="text-sm text-slate-600 dark:text-slate-400">
                                    {slab.grading_company?.name || slab.grading_company?.code} {slab.grade} • {slab.set_name}
                                    {slab.card_number && ` • #${slab.card_number}`}
                                  </p>
                                  {slab.cert_number && (
                                    <p className="text-xs text-slate-500 mt-1">Cert #{slab.cert_number}</p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="text-2xl font-bold text-blue-600">${formatPrice(slab.price)}</p>
                                  <p className="text-xs text-slate-500 mt-1">
                                    {slab.created_at ? new Date(slab.created_at).toLocaleDateString() : "Unknown date"}
                                  </p>
                                </div>
                              </div>

                              {/* Stats */}
                              <div className="flex items-center gap-6 text-sm text-slate-600 dark:text-slate-400">
                                <span className="flex items-center gap-1">
                                  <Eye className="h-4 w-4" />
                                  {slab.views || 0} views
                                </span>
                                <span className="flex items-center gap-1">
                                  <Heart className="h-4 w-4" />
                                  {slab.watchlist_count || 0} watchers
                                </span>
                              </div>

                              {/* Actions */}
                              <div className="flex gap-2 pt-2 border-t">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => router.push(`/sell?edit=${slab.id}`)}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </Button>
                                <Button size="sm" asChild variant="outline">
                                  <Link href={`/slab/${slab.id}`}>View Details</Link>
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleDeleteSlab(slab.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="purchases" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Purchase History</CardTitle>
                <CardDescription>Your completed transactions</CardDescription>
              </CardHeader>
              <CardContent>
                {purchases.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                    <p className="text-slate-600 dark:text-slate-400 mb-4">No purchases yet</p>
                    <Button asChild>
                      <Link href="/marketplace">Browse Marketplace</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {purchases.map((transaction: any) => {
                      const slab = transaction.slab;
                      return (
                        <div key={transaction.id} className="flex items-center gap-4 p-4 border rounded-lg">
                          <div className="relative h-16 w-16 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded overflow-hidden">
                            {slab?.images && slab.images.length > 0 ? (
                              <Image 
                                src={slab.images[0]} 
                                alt={slab?.name || "Slab"} 
                                fill
                                className="object-cover"
                                sizes="64px"
                                loading="lazy"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center text-2xl">⚡</div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">{slab?.name || "Unknown"}</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {slab?.grading_company?.name || slab?.grading_company?.code} {slab?.grade} • {slab?.set_name}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {transaction.created_at ? new Date(transaction.created_at).toLocaleDateString() : "Unknown date"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold">${formatPrice(transaction.price || 0)}</p>
                            <Badge className={transaction.status === "completed" ? "bg-green-600" : "bg-yellow-600"}>
                              {transaction.status}
                            </Badge>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/transaction/${transaction.id}`}>View Details</Link>
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="portfolio" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Portfolio Analytics</CardTitle>
                    <CardDescription>Track your collection&apos;s performance</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleExportPortfolio("csv")}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Export CSV
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleExportPortfolio("excel")}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Export Excel
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Portfolio Value Chart */}
                {portfolioHistory.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium mb-4">Portfolio Value (Last 30 Days)</h3>
                    <div className="h-64 bg-slate-50 dark:bg-slate-900 rounded-lg p-4 flex items-end justify-between gap-1">
                      {portfolioHistory.map((point, index) => {
                        const maxValue = Math.max(...portfolioHistory.map(p => p.value));
                        const minValue = Math.min(...portfolioHistory.map(p => p.value));
                        const range = maxValue - minValue || 1;
                        const height = ((point.value - minValue) / range) * 100;
                        
                        return (
                          <div
                            key={index}
                            className="flex-1 flex flex-col items-center group relative"
                            style={{ minWidth: "2px" }}
                          >
                            <div
                              className="w-full bg-gradient-to-t from-blue-600 to-purple-600 rounded-t hover:from-blue-700 hover:to-purple-700 transition-colors cursor-pointer"
                              style={{ height: `${height}%`, minHeight: "2px" }}
                              title={`$${formatPrice(point.value)} - ${new Date(point.date).toLocaleDateString()}`}
                            />
                            {index % 7 === 0 && (
                              <span className="text-xs text-slate-500 mt-1 transform -rotate-45 origin-top-left whitespace-nowrap">
                                {new Date(point.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Portfolio Statistics */}
                <div className="grid md:grid-cols-3 gap-4 mt-6">
                  <div className="text-center p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Items</p>
                    <p className="text-2xl font-bold">{stats.activeListings}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {userSlabs.filter((s: Slab) => s.status === "sold").length} sold
                    </p>
                  </div>
                  <div className="text-center p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Avg. Value</p>
                    <p className="text-2xl font-bold">${formatPrice(stats.averageSlabValue)}</p>
                    <p className="text-xs text-slate-500 mt-1">per slab</p>
                  </div>
                  <div className="text-center p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Portfolio Growth</p>
                    <p className={`text-2xl font-bold ${stats.portfolioGrowth >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {stats.portfolioGrowth >= 0 ? "+" : ""}{stats.portfolioGrowth.toFixed(1)}%
                    </p>
                    <p className="text-xs text-slate-500 mt-1">vs purchase cost</p>
                  </div>
                </div>

                {/* Sales Performance */}
                {salesTransactions.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium mb-4">Sales Performance</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Sales</p>
                        <p className="text-2xl font-bold">${formatPrice(stats.totalSales)}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {salesTransactions.filter((t: any) => t.status === "completed").length} completed transactions
                        </p>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Average Sale Price</p>
                        <p className="text-2xl font-bold">
                          ${formatPrice(
                            salesTransactions.filter((t: any) => t.status === "completed").length > 0
                              ? stats.totalSales / salesTransactions.filter((t: any) => t.status === "completed").length
                              : 0
                          )}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">per transaction</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}
