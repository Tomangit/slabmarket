import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MainHeader } from "@/components/MainHeader";
import { Footer } from "@/components/Footer";
import { TrendingUp, TrendingDown, BarChart3, DollarSign, Activity, ArrowUpRight, ArrowDownRight } from "lucide-react";
import Link from "next/link";
import { marketTrendsService, type PriceTrend, type MarketTrend } from "@/services/marketTrendsService";
import { formatPrice } from "@/lib/utils";

export default function TrendsPage() {
  const t = useTranslations();
  const [selectedPeriod, setSelectedPeriod] = useState<7 | 30 | 90 | 180>(30);
  const [topGainers, setTopGainers] = useState<PriceTrend[]>([]);
  const [topLosers, setTopLosers] = useState<PriceTrend[]>([]);
  const [marketTrends, setMarketTrends] = useState<MarketTrend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrends();
  }, [selectedPeriod]);

  const loadTrends = async () => {
    try {
      setLoading(true);
      const [gainers, losers, trends] = await Promise.all([
        marketTrendsService.getTopGainers(20, { days: selectedPeriod }),
        marketTrendsService.getTopLosers(20, { days: selectedPeriod }),
        marketTrendsService.getMarketTrendsByCard(20, { days: selectedPeriod }),
      ]);
      setTopGainers(gainers);
      setTopLosers(losers);
      setMarketTrends(trends);
    } catch (error) {
      console.error("Error loading trends:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <MainHeader currentPage="trends" />

      <div className="container mx-auto px-4 py-8 flex-1">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{t('trends.title')}</h1>
              <p className="text-slate-600 dark:text-slate-400">
                {t('trends.subtitle')}
              </p>
            </div>
            <Select
              value={selectedPeriod.toString()}
              onValueChange={(value) => setSelectedPeriod(parseInt(value) as 7 | 30 | 90 | 180)}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">{t('trends.last7Days')}</SelectItem>
                <SelectItem value="30">{t('trends.last30Days')}</SelectItem>
                <SelectItem value="90">{t('trends.last90Days')}</SelectItem>
                <SelectItem value="180">{t('trends.last180Days')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('trends.topGainers')}</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {topGainers.length > 0 ? `+${topGainers[0].price_change_percent.toFixed(1)}%` : "—"}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {topGainers.length > 0
                  ? `${topGainers[0].card_name} (${topGainers[0].grade})`
                  : t('trends.noData')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('trends.topLosers')}</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {topLosers.length > 0 ? `${topLosers[0].price_change_percent.toFixed(1)}%` : "—"}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {topLosers.length > 0
                  ? `${topLosers[0].card_name} (${topLosers[0].grade})`
                  : t('trends.noData')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('trends.activeCards')}</CardTitle>
              <Activity className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{marketTrends.length}</div>
              <p className="text-xs text-slate-500 mt-1">{t('trends.cardsWithTrends')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="gainers" className="space-y-6">
          <TabsList>
            <TabsTrigger value="gainers">
              <TrendingUp className="h-4 w-4 mr-2" />
              {t('trends.topGainers')}
            </TabsTrigger>
            <TabsTrigger value="losers">
              <TrendingDown className="h-4 w-4 mr-2" />
              {t('trends.topLosers')}
            </TabsTrigger>
            <TabsTrigger value="market">
              <BarChart3 className="h-4 w-4 mr-2" />
              {t('trends.marketTrends')}
            </TabsTrigger>
          </TabsList>

          {/* Top Gainers */}
          <TabsContent value="gainers">
            <Card>
              <CardHeader>
                <CardTitle>{t('trends.topGainers')}</CardTitle>
                <CardDescription>{t('trends.topGainersDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12">
                    <p className="text-slate-600 dark:text-slate-400">{t('common.loading')}</p>
                  </div>
                ) : topGainers.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-600 dark:text-slate-400">{t('trends.noData')}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {topGainers.map((trend, index) => (
                      <div
                        key={trend.slab_id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                            <span className="text-sm font-bold text-green-600 dark:text-green-400">
                              {index + 1}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Link
                                href={`/card/${trend.card_id}`}
                                className="font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                              >
                                {trend.card_name}
                              </Link>
                              <Badge variant="outline">{trend.set_name}</Badge>
                              <Badge variant="secondary">{trend.grade}</Badge>
                              <Badge variant="outline" className="text-xs">
                                {trend.grading_company}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                              <span>
                                {t('trends.previousPrice')}: ${formatPrice(trend.previous_price)}
                              </span>
                              <span>→</span>
                              <span className="font-semibold text-green-600 dark:text-green-400">
                                ${formatPrice(trend.current_price)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-green-600 dark:text-green-400 font-bold">
                              <ArrowUpRight className="h-4 w-4" />
                              <span>+{trend.price_change_percent.toFixed(1)}%</span>
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                              +${formatPrice(Math.abs(trend.price_change))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Top Losers */}
          <TabsContent value="losers">
            <Card>
              <CardHeader>
                <CardTitle>{t('trends.topLosers')}</CardTitle>
                <CardDescription>{t('trends.topLosersDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12">
                    <p className="text-slate-600 dark:text-slate-400">{t('common.loading')}</p>
                  </div>
                ) : topLosers.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-600 dark:text-slate-400">{t('trends.noData')}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {topLosers.map((trend, index) => (
                      <div
                        key={trend.slab_id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                            <span className="text-sm font-bold text-red-600 dark:text-red-400">
                              {index + 1}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Link
                                href={`/card/${trend.card_id}`}
                                className="font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                              >
                                {trend.card_name}
                              </Link>
                              <Badge variant="outline">{trend.set_name}</Badge>
                              <Badge variant="secondary">{trend.grade}</Badge>
                              <Badge variant="outline" className="text-xs">
                                {trend.grading_company}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                              <span>
                                {t('trends.previousPrice')}: ${formatPrice(trend.previous_price)}
                              </span>
                              <span>→</span>
                              <span className="font-semibold text-red-600 dark:text-red-400">
                                ${formatPrice(trend.current_price)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-red-600 dark:text-red-400 font-bold">
                              <ArrowDownRight className="h-4 w-4" />
                              <span>{trend.price_change_percent.toFixed(1)}%</span>
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                              -${formatPrice(Math.abs(trend.price_change))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Market Trends */}
          <TabsContent value="market">
            <Card>
              <CardHeader>
                <CardTitle>{t('trends.marketTrends')}</CardTitle>
                <CardDescription>{t('trends.marketTrendsDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12">
                    <p className="text-slate-600 dark:text-slate-400">{t('common.loading')}</p>
                  </div>
                ) : marketTrends.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-600 dark:text-slate-400">{t('trends.noData')}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {marketTrends.map((trend, index) => (
                      <div
                        key={trend.card_id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                              {index + 1}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Link
                                href={`/card/${trend.card_id}`}
                                className="font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                              >
                                {trend.card_name}
                              </Link>
                              <Badge variant="outline">{trend.set_name}</Badge>
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                {trend.listings_count} {t('trends.listings')}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                              <span>
                                {t('trends.previousAvg')}: ${formatPrice(trend.previous_avg_price)}
                              </span>
                              <span>→</span>
                              <span className="font-semibold">
                                ${formatPrice(trend.current_avg_price)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="text-right">
                            <div
                              className={`flex items-center gap-1 font-bold ${
                                trend.price_change >= 0
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-red-600 dark:text-red-400"
                              }`}
                            >
                              {trend.price_change >= 0 ? (
                                <ArrowUpRight className="h-4 w-4" />
                              ) : (
                                <ArrowDownRight className="h-4 w-4" />
                              )}
                              <span>
                                {trend.price_change >= 0 ? "+" : ""}
                                {trend.price_change_percent.toFixed(1)}%
                              </span>
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                              {trend.price_change >= 0 ? "+" : ""}
                              ${formatPrice(Math.abs(trend.price_change))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
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

