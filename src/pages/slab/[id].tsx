import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { MainHeader } from "@/components/MainHeader";
import { Footer } from "@/components/Footer";
import { ShieldCheck, TrendingUp, Heart, Share2, Eye, Package, AlertCircle, Star, Bell, DollarSign, MessageSquare, BarChart3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { slabService } from "@/services/slabService";
import { watchlistService } from "@/services/watchlistService";
import { priceHistoryService, type PricePoint, type MarketIndex } from "@/services/priceHistoryService";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { PriceDisplay } from "@/components/PriceDisplay";
import { PriceHistoryChart } from "@/components/PriceHistoryChart";
import { formatPrice } from "@/lib/utils";
import { messageService } from "@/services/messageService";
import { AddToWishlistButton } from "@/components/AddToWishlistButton";
import type { Database } from "@/integrations/supabase/types";

type Slab = Database["public"]["Tables"]["slabs"]["Row"] & {
  category: { id: string; name: string; slug: string } | null;
  grading_company: { id: string; name: string; code: string } | null;
  seller: { id: string; full_name: string | null; avatar_url: string | null; email: string | null } | null;
};

export default function SlabDetailPage(): JSX.Element {
  const router = useRouter();
  const { id } = router.query;
  const t = useTranslations();
  const { user } = useAuth();
  const { addItem } = useCart();
  const { toast } = useToast();
  const [slab, setSlab] = useState<Slab | null>(null);
  const [loading, setLoading] = useState(true);
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [watchlistId, setWatchlistId] = useState<string | null>(null);
  const [priceAlert, setPriceAlert] = useState<number | null>(null);
  const [priceAlertInput, setPriceAlertInput] = useState("");
  const [updatingPriceAlert, setUpdatingPriceAlert] = useState(false);
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [priceHistoryLoading, setPriceHistoryLoading] = useState(false);
  const [marketIndex, setMarketIndex] = useState<MarketIndex | null>(null);
  const [marketIndexLoading, setMarketIndexLoading] = useState(false);

  const loadSlabData = async (slabId: string) => {
    try {
      setLoading(true);
      const slabData = await slabService.getSlabById(slabId);
      setSlab(slabData);

      // Increment views
      await slabService.incrementViews(slabId);

      // Check if watchlisted and get watchlist item details
      if (user) {
        const watchlisted = await watchlistService.checkIfWatchlisted(user.id, slabId);
        setIsWatchlisted(watchlisted);
        
        if (watchlisted) {
          const watchlist = await watchlistService.getUserWatchlist(user.id);
          const item = watchlist?.find((w: any) => w.slab_id === slabId);
          if (item) {
            setWatchlistId(item.id);
            setPriceAlert(item.price_alert || null);
            setPriceAlertInput(item.price_alert ? item.price_alert.toString() : "");
          }
        }
      }

      // Load price history
      loadPriceHistory(slabId);
      
      // Load market index
      loadMarketIndex(slabData);
    } catch (error) {
      console.error("Error loading slab:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadPriceHistory = async (slabId: string) => {
    try {
      setPriceHistoryLoading(true);
      const history = await priceHistoryService.getSlabPriceHistory(slabId, 90);
      setPriceHistory(history);
    } catch (error) {
      console.error("Error loading price history:", error);
    } finally {
      setPriceHistoryLoading(false);
    }
  };

  const loadMarketIndex = async (slabData: Slab) => {
    if (!slabData.grading_company?.id || !slabData.grade) return;
    
    try {
      setMarketIndexLoading(true);
      const index = await priceHistoryService.getGradeIndex(
        slabData.grade,
        slabData.grading_company.id,
        slabData.category_id || undefined,
        30
      );
      setMarketIndex(index);
    } catch (error) {
      console.error("Error loading market index:", error);
    } finally {
      setMarketIndexLoading(false);
    }
  };

  const handleWatchlistToggle = async () => {
    if (!user || !slab) return;

    try {
      if (isWatchlisted) {
        // Remove from watchlist - we need to find the watchlist entry first
        const watchlist = await watchlistService.getUserWatchlist(user.id);
        const item = watchlist?.find((w: any) => w.slab_id === slab.id);
        if (item) {
          await watchlistService.removeFromWatchlist(item.id);
          setIsWatchlisted(false);
          setWatchlistId(null);
        }
      } else {
        // Add to watchlist
        const result = await watchlistService.addToWatchlist({
          user_id: user.id,
          slab_id: slab.id,
          price_alert: null,
        });
        setIsWatchlisted(true);
        setWatchlistId(result.id);
        setPriceAlert(null);
        setPriceAlertInput("");
      }
    } catch (error) {
      console.error("Error toggling watchlist:", error);
    }
  };

  const handleBuyNow = () => {
    if (!slab) return;
    
    addItem({
      id: `slab-${slab.id}`,
      cardId: slab.card_id || "",
      name: slab.name,
      price: slab.price,
      imageUrl: slab.images?.[0] || null,
      gradingCompany: slab.grading_company?.code || null,
      grade: slab.grade || null,
      sellerName: slab.seller?.full_name || null,
      quantity: 1,
    });

    router.push("/checkout");
  };

  useEffect(() => {
    if (id && typeof id === "string") {
      loadSlabData(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  if (loading) {
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

  if (!slab) {
    return (
      <div className="min-h-screen flex flex-col">
        <MainHeader />
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Slab Not Found</CardTitle>
              <CardDescription>The slab you&apos;re looking for doesn&apos;t exist.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/marketplace">Back to Marketplace</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <MainHeader currentPage="marketplace" />

      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-6">
          <Link href="/" className="hover:text-blue-600">Home</Link>
          <span>/</span>
          <Link href="/marketplace" className="hover:text-blue-600">Marketplace</Link>
          <span>/</span>
          <span className="text-slate-900 dark:text-slate-100">{slab.name}</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Card>
              <CardContent className="p-0">
                <div className="relative aspect-[3/4] bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-lg overflow-hidden flex items-center justify-center">
                  {slab.images && slab.images.length > 0 ? (
                    <Image
                      src={slab.images[0]}
                      alt={slab.name}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      priority
                      placeholder="blur"
                      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-9xl">
                      🃏
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {slab.cert_verified && (
              <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950">
                <CardContent className="p-4 flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-900 dark:text-green-100">Certificate Verified</p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      This slab has been verified against {slab.grading_company?.name || "the grading company"} official database
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-3xl font-bold">{slab.name}</h1>
                <div className="flex gap-2">
                  <AddToWishlistButton
                    slabId={slab.id}
                    variant="outline"
                    size="icon"
                    onAdd={() => {
                      // Optionally refresh data or show notification
                    }}
                  />
                  <Button variant="outline" size="icon">
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                {slab.set_name || "Unknown Set"} {slab.card_number && `• #${slab.card_number}`}
              </p>
              
              <div className="flex flex-wrap gap-2 mb-6">
                <Badge className="bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100">
                  {slab.grading_company?.name || slab.grading_company?.code || "Unknown"} {slab.grade}
                </Badge>
                {slab.listing_type === "featured" && (
                  <Badge className="bg-yellow-100 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-100">
                    Featured
                  </Badge>
                )}
                <Badge variant="outline" className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {slab.views || 0} views
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  {slab.watchlist_count || 0} watching
                </Badge>
              </div>

              <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-6 mb-6">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-bold">
                    <PriceDisplay price={slab.price} fromCurrency={(slab.currency as any) || "USD"} />
                  </span>
                </div>
              </div>

              {/* Compare Prices Button */}
              <div className="mb-6">
                <Button
                  asChild
                  variant="outline"
                  className="w-full md:w-auto"
                >
                  <Link href={`/compare?cardName=${encodeURIComponent(slab.name || "")}${slab.set_name ? `&setId=${encodeURIComponent(slab.set_name)}` : ""}`}>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Compare Prices
                  </Link>
                </Button>
              </div>

              {/* Price Alert Section */}
              {isWatchlisted && user && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      Price Alert
                    </CardTitle>
                    <CardDescription>
                      Get notified when the price drops to your target
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Label htmlFor="price-alert">Alert me when price is below</Label>
                        <div className="relative mt-2">
                          <DollarSign className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <Input
                            id="price-alert"
                            type="number"
                            value={priceAlertInput}
                            onChange={(e) => setPriceAlertInput(e.target.value)}
                            placeholder="Enter target price"
                            className="pl-10"
                            step="0.01"
                            min="0"
                          />
                        </div>
                      </div>
                      <div className="flex items-end">
                        <Button
                          onClick={async () => {
                            if (!watchlistId || !slab) return;
                            
                            const alertValue = priceAlertInput ? parseFloat(priceAlertInput) : null;
                            
                            try {
                              setUpdatingPriceAlert(true);
                              if (alertValue && alertValue > 0) {
                                await watchlistService.updatePriceAlert(watchlistId, alertValue);
                                setPriceAlert(alertValue);
                                toast({
                                  title: "Price alert set",
                                  description: `You'll be notified when the price drops below $${alertValue.toLocaleString()}`,
                                });
                              } else {
                                // Remove price alert
                                await watchlistService.updatePriceAlert(watchlistId, 0);
                                setPriceAlert(null);
                                setPriceAlertInput("");
                                toast({
                                  title: "Price alert removed",
                                });
                              }
                            } catch (error) {
                              console.error("Error updating price alert:", error);
                              toast({
                                title: "Error",
                                description: "Failed to update price alert",
                                variant: "destructive",
                              });
                            } finally {
                              setUpdatingPriceAlert(false);
                            }
                          }}
                          disabled={updatingPriceAlert}
                        >
                          {updatingPriceAlert ? "Saving..." : priceAlert ? "Update Alert" : "Set Alert"}
                        </Button>
                      </div>
                    </div>
                    {priceAlert && (
                      <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                        <p className="text-sm text-green-900 dark:text-green-100">
                          <Bell className="h-4 w-4 inline mr-1" />
                          Alert active: Notify me when price drops below <PriceDisplay price={priceAlert} fromCurrency={(slab?.currency as any) || "USD"} />
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-3 mb-6">
                <Button size="lg" className="flex-1" onClick={handleBuyNow}>Buy Now</Button>
                <Button size="lg" variant="outline">Make Offer</Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {slab.escrow_protection && (
                  <div className="flex items-center gap-2 text-sm">
                    <ShieldCheck className="h-4 w-4 text-green-600" />
                    <span>Escrow Protected</span>
                  </div>
                )}
                {slab.buyer_protection && (
                  <div className="flex items-center gap-2 text-sm">
                    <ShieldCheck className="h-4 w-4 text-blue-600" />
                    <span>Buyer Protection</span>
                  </div>
                )}
                {slab.shipping_insured && (
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="h-4 w-4 text-purple-600" />
                    <span>Insured Shipping</span>
                  </div>
                )}
                {slab.shipping_temperature_controlled && (
                  <div className="flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <span>Climate Control</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Seller Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                      {slab.seller?.full_name?.[0] || slab.seller?.email?.[0] || "?"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{slab.seller?.full_name || slab.seller?.email || "Unknown Seller"}</p>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
                        <span>Seller</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {user && slab.seller?.id && user.id !== slab.seller.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            const conversation = await messageService.getOrCreateConversation(
                              user.id,
                              slab.seller!.id
                            );
                            router.push(`/messages/${conversation.id}`);
                          } catch (error) {
                            console.error("Error creating conversation:", error);
                            toast({
                              title: "Błąd",
                              description: "Nie udało się otworzyć konwersacji",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Wyślij wiadomość
                      </Button>
                    )}
                    <Button variant="outline" size="sm">View Profile</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Separator />

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Shipping & Handling</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Shipping Cost</span>
                  <span className="font-semibold">
                    {slab.shipping_cost ? (
                      <PriceDisplay price={slab.shipping_cost} fromCurrency={(slab.currency as any) || "USD"} />
                    ) : (
                      "Contact seller"
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Estimated Delivery</span>
                  <span className="font-semibold">
                    {slab.shipping_estimated_days ? `${slab.shipping_estimated_days} business days` : "Contact seller"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Insurance</span>
                  <span className="font-semibold">{slab.shipping_insured ? "Included" : "Not available"}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-12">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="history">Price History</TabsTrigger>
              <TabsTrigger value="cert">Certificate</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Card Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Grading Company</p>
                      <p className="font-semibold">{slab.grading_company?.name || slab.grading_company?.code || "Unknown"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Overall Grade</p>
                      <p className="font-semibold">{slab.grade}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Set</p>
                      <p className="font-semibold">{slab.set_name || "Unknown"}</p>
                    </div>
                    {slab.year && (
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Year</p>
                        <p className="font-semibold">{slab.year}</p>
                      </div>
                    )}
                    {slab.card_number && (
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Card Number</p>
                        <p className="font-semibold">{slab.card_number}</p>
                      </div>
                    )}
                    {slab.pop_report_total && (
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Population Report</p>
                        <p className="font-semibold">{slab.pop_report_total} total graded</p>
                      </div>
                    )}
                  </div>
                  
                  {(slab.subgrade_centering || slab.subgrade_corners || slab.subgrade_edges || slab.subgrade_surface) && (
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Subgrades</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {slab.subgrade_centering && (
                          <div className="text-center p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Centering</p>
                            <p className="text-xl font-bold">{slab.subgrade_centering}</p>
                          </div>
                        )}
                        {slab.subgrade_corners && (
                          <div className="text-center p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Corners</p>
                            <p className="text-xl font-bold">{slab.subgrade_corners}</p>
                          </div>
                        )}
                        {slab.subgrade_edges && (
                          <div className="text-center p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Edges</p>
                            <p className="text-xl font-bold">{slab.subgrade_edges}</p>
                          </div>
                        )}
                        {slab.subgrade_surface && (
                          <div className="text-center p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Surface</p>
                            <p className="text-xl font-bold">{slab.subgrade_surface}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {slab.description && (
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Description</p>
                      <p>{slab.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="mt-6 space-y-6">
              {/* Price History Chart */}
              {priceHistoryLoading ? (
                <Card>
                  <CardContent className="py-8">
                    <div className="text-center">
                      <p className="text-slate-600 dark:text-slate-400">Loading price history...</p>
                    </div>
                  </CardContent>
                </Card>
              ) : priceHistory.length > 0 ? (
                <PriceHistoryChart
                  data={priceHistory}
                  currentPrice={slab?.price}
                  title="Price History"
                  height={300}
                />
              ) : (
                <Card>
                  <CardContent className="py-8">
                    <div className="text-center">
                      <p className="text-slate-600 dark:text-slate-400">No price history available yet</p>
                      <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                        Price history will be recorded daily once the listing is active
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Market Index */}
              {slab && slab.grading_company?.id && slab.grade && (
                <Card>
                  <CardHeader>
                    <CardTitle>Market Index</CardTitle>
                    <CardDescription>
                      Average price for {slab.grading_company?.code || ''} {slab.grade} slabs
                      {slab.category?.name ? ` in ${slab.category.name}` : ''}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {marketIndexLoading ? (
                      <div className="text-center py-8">
                        <p className="text-slate-600 dark:text-slate-400">Loading market index...</p>
                      </div>
                    ) : marketIndex ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Current Value</p>
                            <p className="text-2xl font-bold">
                              <PriceDisplay price={marketIndex.currentValue} fromCurrency={(slab.currency as any) || "USD"} />
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Previous Value</p>
                            <p className="text-2xl font-bold">
                              <PriceDisplay price={marketIndex.previousValue} fromCurrency={(slab.currency as any) || "USD"} />
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Change (30 days)</p>
                            <p className={`text-2xl font-bold ${marketIndex.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {marketIndex.change >= 0 ? '+' : ''}
                              <PriceDisplay price={marketIndex.change} fromCurrency={(slab.currency as any) || "USD"} />
                              {' '}
                              ({marketIndex.changePercent >= 0 ? '+' : ''}
                              {marketIndex.changePercent.toFixed(1)}%)
                            </p>
                          </div>
                        </div>
                        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600 dark:text-slate-400">Based on {marketIndex.dataPoints} data points</span>
                            <span className="text-slate-600 dark:text-slate-400">{marketIndex.timeRange}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-slate-600 dark:text-slate-400">Insufficient market data</p>
                        <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                          Market index will be available once there's enough price history data
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Price History Table - Keep for reference */}
              {priceHistory.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Price History Table</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Price Statistics */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Current Price</p>
                          <p className="text-2xl font-bold text-blue-600">
                            <PriceDisplay price={slab?.price || 0} fromCurrency={(slab.currency as any) || "USD"} />
                          </p>
                        </div>
                        {priceHistory.length > 1 && (() => {
                          const firstPrice = priceHistory[0].price;
                          const lastPrice = priceHistory[priceHistory.length - 1].price;
                          const change = lastPrice - firstPrice;
                          const changePercent = ((change / firstPrice) * 100);
                          return (
                            <>
                              <div className="text-center p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Price Change</p>
                                <p className={`text-2xl font-bold ${change >= 0 ? "text-green-600" : "text-red-600"}`}>
                                  {change >= 0 ? "+" : ""}
                                  <PriceDisplay price={change} fromCurrency={(slab.currency as any) || "USD"} />
                                </p>
                              </div>
                              <div className="text-center p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Change %</p>
                                <p className={`text-2xl font-bold ${changePercent >= 0 ? "text-green-600" : "text-red-600"}`}>
                                  {changePercent >= 0 ? "+" : ""}{changePercent.toFixed(1)}%
                                </p>
                              </div>
                            </>
                          );
                        })()}
                      </div>

                      {/* Simple Line Chart */}
                      <div className="mt-6">
                        <h3 className="text-sm font-medium mb-4">Price Trend ({priceHistory.length} data points)</h3>
                        <div className="h-64 bg-slate-50 dark:bg-slate-900 rounded-lg p-4 flex items-end justify-between gap-1">
                          {priceHistory.map((point, index) => {
                            const maxPrice = Math.max(...priceHistory.map(p => p.price));
                            const minPrice = Math.min(...priceHistory.map(p => p.price));
                            const range = maxPrice - minPrice || 1;
                            const height = ((point.price - minPrice) / range) * 100;
                            
                            return (
                              <div
                                key={index}
                                className="flex-1 flex flex-col items-center group relative"
                                style={{ minWidth: "2px" }}
                              >
                                <div
                                  className="w-full bg-blue-600 rounded-t hover:bg-blue-700 transition-colors cursor-pointer"
                                  style={{ height: `${height}%`, minHeight: "2px" }}
                                  title={`$${formatPrice(point.price)} - ${new Date(point.date).toLocaleDateString()}`}
                                />
                                {index % Math.ceil(priceHistory.length / 10) === 0 && (
                                  <span className="text-xs text-slate-500 mt-1 transform -rotate-45 origin-top-left whitespace-nowrap">
                                    {new Date(point.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Price History Table */}
                      <div className="mt-6">
                        <h3 className="text-sm font-medium mb-3">Recent Price History</h3>
                        <div className="border rounded-lg overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-slate-100 dark:bg-slate-800">
                              <tr>
                                <th className="text-left p-3 font-medium">Date</th>
                                <th className="text-right p-3 font-medium">Price</th>
                              </tr>
                            </thead>
                            <tbody>
                              {priceHistory.slice(-10).reverse().map((point, index) => (
                                <tr key={index} className="border-t">
                                  <td className="p-3 text-slate-600 dark:text-slate-400">
                                    {new Date(point.date).toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </td>
                                  <td className="p-3 text-right font-semibold">
                                    ${formatPrice(point.price)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                </CardContent>
              </Card>
              )}
            </TabsContent>

            <TabsContent value="cert" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Certificate Information</CardTitle>
                  <CardDescription>Official grading certificate details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Certificate Number</p>
                      <p className="font-mono font-semibold text-lg">{slab.cert_number}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Verification Status</p>
                      <Badge className={slab.cert_verified ? "bg-green-600" : "bg-red-600"}>
                        <ShieldCheck className="h-3 w-3 mr-1" />
                        {slab.cert_verified ? "Verified" : "Unverified"}
                      </Badge>
                    </div>
                  </div>
                  
                  {slab.cert_verified && (
                    <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                      <p className="text-sm text-green-900 dark:text-green-100">
                        This certificate has been verified against {slab.grading_company?.name || slab.grading_company?.code || "grading company"}&apos;s official database 
                        {slab.cert_verified_at && ` on ${new Date(slab.cert_verified_at).toLocaleDateString()}`}. The verification confirms the authenticity 
                        of the grading and certificate number.
                      </p>
                    </div>
                  )}

                  {slab.grading_company && (
                    <Button variant="outline" className="w-full" asChild>
                      <a 
                        href={`https://www.${slab.grading_company.code?.toLowerCase() || "psa"}card.com/cert/${slab.cert_number}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Verify Certificate on {slab.grading_company.name || slab.grading_company.code} Website
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Footer />
    </div>
    </>
  );
}
