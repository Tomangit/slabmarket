
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MainHeader } from "@/components/MainHeader";
import { Footer } from "@/components/Footer";
import { Heart, TrendingUp, Bell, X, Search, Eye } from "lucide-react";
import Link from "next/link";
import { mockSlabs } from "@/lib/mockData";

export default function WatchlistPage() {
  const [priceAlerts, setPriceAlerts] = useState<Record<string, number>>({
    "1": 40000,
    "2": 250000,
    "3": 8000
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <MainHeader currentPage="watchlist" />

      <div className="container mx-auto px-4 py-8 flex-1">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Your Watchlist</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Track your favorite slabs and set price alerts
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Watching</CardTitle>
              <Heart className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockSlabs.length}</div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Total items tracked
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Price Alerts</CardTitle>
              <Bell className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-green-600 mt-1">
                Active price alerts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg. Change</CardTitle>
              <TrendingUp className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">+8.4%</div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Last 30 days
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              type="search"
              placeholder="Search watchlist..."
              className="pl-10"
            />
          </div>
          <Select defaultValue="recent">
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recently Added</SelectItem>
              <SelectItem value="price-change">Biggest Change</SelectItem>
              <SelectItem value="alert">Alerts First</SelectItem>
              <SelectItem value="value-high">Highest Value</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Watchlist Items */}
        <div className="space-y-4">
          {mockSlabs.map((slab) => (
            <Card key={slab.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Image */}
                  <div className="w-full md:w-32 aspect-[3/4] bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-lg flex items-center justify-center text-4xl shrink-0">
                    🔥
                  </div>

                  {/* Details */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-bold">{slab.name}</h3>
                          {slab.certVerified && (
                            <Badge variant="secondary" className="text-xs">
                              Verified
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {slab.gradingCompany} {slab.grade} • {slab.set}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" className="shrink-0">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      <div>
                        <p className="text-2xl font-bold text-blue-600">
                          ${slab.price.toLocaleString()}
                        </p>
                        {slab.priceHistory && slab.priceHistory.length > 1 && (
                          <p className="text-sm text-green-600 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            +{(((slab.price - slab.priceHistory[0].price) / slab.priceHistory[0].price) * 100).toFixed(1)}% 
                            (30d)
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Eye className="h-4 w-4" />
                        <span>{slab.views} views</span>
                      </div>
                    </div>

                    {/* Price Alert */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1">
                        <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">
                          Price Alert (notify me when below)
                        </label>
                        <Input
                          type="number"
                          value={priceAlerts[slab.id] || ""}
                          onChange={(e) => setPriceAlerts({
                            ...priceAlerts,
                            [slab.id]: parseInt(e.target.value) || 0
                          })}
                          placeholder="Enter target price"
                          className="h-9"
                        />
                      </div>
                      <div className="flex gap-2 sm:items-end">
                        <Button size="sm" asChild className="flex-1 sm:flex-none">
                          <Link href={`/slab/${slab.id}`}>View Details</Link>
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 sm:flex-none">
                          <Bell className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Set Alert</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {mockSlabs.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Heart className="h-16 w-16 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Your watchlist is empty</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Start tracking slabs you&apos;re interested in to monitor price changes and get alerts
              </p>
              <Button asChild>
                <Link href="/marketplace">Browse Marketplace</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Footer />
    </div>
  );
}
