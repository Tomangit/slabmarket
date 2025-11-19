import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { MainHeader } from "@/components/MainHeader";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { priceComparisonService, type ComparisonItem } from "@/services/priceComparisonService";
import { formatPrice } from "@/lib/utils";
import { ShieldCheck, TrendingUp, TrendingDown, DollarSign, Search, Loader2, Eye, Heart, BarChart3, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ComparePage() {
  const t = useTranslations();
  const router = useRouter();
  const { cardName, setId } = router.query;

  const [searchCardName, setSearchCardName] = useState(cardName as string || "");
  const [searchSetName, setSearchSetName] = useState((setId as string) || "");
  const [comparisonItems, setComparisonItems] = useState<ComparisonItem[]>([]);
  const [marketStats, setMarketStats] = useState<{
    averagePrice: number;
    minPrice: number;
    maxPrice: number;
    count: number;
    gradeDistribution: Record<string, number>;
    priceByGrade: Record<string, { avg: number; min: number; max: number; count: number }>;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("compare");

  useEffect(() => {
    if (cardName && typeof cardName === "string") {
      setSearchCardName(cardName);
      handleCompare();
    }
  }, [cardName]);

  const handleCompare = async () => {
    if (!searchCardName.trim()) {
      return;
    }

    try {
      setLoading(true);
      const [items, stats] = await Promise.all([
        priceComparisonService.compareGrades(searchCardName, searchSetName || undefined),
        priceComparisonService.getMarketStats(searchCardName, searchSetName || undefined),
      ]);

      setComparisonItems(items);
      setMarketStats(stats);
      setActiveTab("compare");
    } catch (error) {
      console.error("Error comparing prices:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCompare();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <MainHeader />

      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Price Comparison</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Compare prices across different grades and listings for the same card
          </p>
        </div>

        {/* Search Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search for Comparison</CardTitle>
            <CardDescription>
              Enter card name and optionally set name to compare prices
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="card-name">Card Name *</Label>
                <Input
                  id="card-name"
                  placeholder="e.g., Pikachu"
                  value={searchCardName}
                  onChange={(e) => setSearchCardName(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="set-name">Set Name (optional)</Label>
                <Input
                  id="set-name"
                  placeholder="e.g., Base Set"
                  value={searchSetName}
                  onChange={(e) => setSearchSetName(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
              </div>
            </div>
            <Button onClick={handleCompare} disabled={loading || !searchCardName.trim()}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Compare Prices
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {marketStats && marketStats.count > 0 && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="compare">Price Comparison</TabsTrigger>
              <TabsTrigger value="stats">Market Statistics</TabsTrigger>
            </TabsList>

            <TabsContent value="compare" className="space-y-6">
              {comparisonItems.length > 0 ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Available Listings</CardTitle>
                      <CardDescription>
                        Found {comparisonItems.length} listing(s) for comparison
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Card</TableHead>
                              <TableHead>Grade</TableHead>
                              <TableHead>Grading Company</TableHead>
                              <TableHead>Price</TableHead>
                              <TableHead>Seller</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {comparisonItems.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    {item.images && item.images.length > 0 ? (
                                      <div className="relative h-12 w-8 rounded overflow-hidden bg-slate-100 dark:bg-slate-800">
                                        <Image
                                          src={item.images[0]}
                                          alt={item.name}
                                          fill
                                          className="object-cover"
                                          sizes="32px"
                                        />
                                      </div>
                                    ) : (
                                      <div className="h-12 w-8 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl">
                                        🃏
                                      </div>
                                    )}
                                    <div>
                                      <div className="font-semibold">{item.name}</div>
                                      {item.set_name && (
                                        <div className="text-sm text-slate-600 dark:text-slate-400">
                                          {item.set_name}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">{item.grade}</Badge>
                                </TableCell>
                                <TableCell>{item.grading_company}</TableCell>
                                <TableCell>
                                  <div className="font-bold text-blue-600">
                                    ${formatPrice(item.price)}
                                  </div>
                                </TableCell>
                                <TableCell>{item.seller_name || "Unknown"}</TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      item.cert_verified
                                        ? "default"
                                        : "secondary"
                                    }
                                  >
                                    {item.cert_verified ? (
                                      <>
                                        <ShieldCheck className="h-3 w-3 mr-1" />
                                        Verified
                                      </>
                                    ) : (
                                      "Unverified"
                                    )}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Button asChild size="sm">
                                    <Link href={`/slab/${item.id}`}>View</Link>
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Price Summary by Grade */}
                  {Object.keys(marketStats.priceByGrade).length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Price Summary by Grade</CardTitle>
                        <CardDescription>
                          Average, minimum, and maximum prices for each grade
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Grade</TableHead>
                                <TableHead>Count</TableHead>
                                <TableHead>Average Price</TableHead>
                                <TableHead>Min Price</TableHead>
                                <TableHead>Max Price</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {Object.entries(marketStats.priceByGrade)
                                .sort((a, b) => {
                                  // Sort by grade numerically (10 > 9.5 > 9, etc.)
                                  const gradeA = parseFloat(a[0]) || 0;
                                  const gradeB = parseFloat(b[0]) || 0;
                                  return gradeB - gradeA;
                                })
                                .map(([grade, stats]) => (
                                  <TableRow key={grade}>
                                    <TableCell>
                                      <Badge variant="outline">{grade}</Badge>
                                    </TableCell>
                                    <TableCell>{stats.count}</TableCell>
                                    <TableCell className="font-semibold">
                                      ${formatPrice(stats.avg)}
                                    </TableCell>
                                    <TableCell>${formatPrice(stats.min)}</TableCell>
                                    <TableCell>${formatPrice(stats.max)}</TableCell>
                                  </TableRow>
                                ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No Listings Found</AlertTitle>
                  <AlertDescription>
                    No active listings found for "{searchCardName}"
                    {searchSetName && ` in set "${searchSetName}"`}.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="stats" className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Average Price</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">${formatPrice(marketStats.averagePrice)}</div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      Across all grades
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Price Range</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <div className="text-xl font-bold text-green-600">
                        ${formatPrice(marketStats.minPrice)}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">to</div>
                      <div className="text-xl font-bold text-red-600">
                        ${formatPrice(marketStats.maxPrice)}
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                      {marketStats.count} listing(s) total
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Total Listings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{marketStats.count}</div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      Active listings
                    </p>
                  </CardContent>
                </Card>
              </div>

              {Object.keys(marketStats.gradeDistribution).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Grade Distribution</CardTitle>
                    <CardDescription>
                      Number of listings by grade
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(marketStats.gradeDistribution)
                        .sort((a, b) => {
                          const gradeA = parseFloat(a[0]) || 0;
                          const gradeB = parseFloat(b[0]) || 0;
                          return gradeB - gradeA;
                        })
                        .map(([grade, count]) => (
                          <div key={grade} className="text-center p-4 border rounded-lg">
                            <div className="text-2xl font-bold">{count}</div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                              Grade {grade}
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}

        {marketStats && marketStats.count === 0 && !loading && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Results</AlertTitle>
            <AlertDescription>
              No listings found for "{searchCardName}"
              {searchSetName && ` in set "${searchSetName}"`}. Try a different search.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <Footer />
    </div>
  );
}

