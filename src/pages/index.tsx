
import { useState, useEffect } from "react";
import { useTranslations } from 'next-intl';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, TrendingUp, Package, Search, Star, Award, Sparkles, Flame, Clock, Heart } from "lucide-react";
import Link from "next/link";
import { MainHeader } from "@/components/MainHeader";
import { Footer } from "@/components/Footer";
import { slabService } from "@/services/slabService";
import { formatPrice } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

export default function HomePage() {
  const t = useTranslations();
  const { user } = useAuth();
  const [featuredSlabs, setFeaturedSlabs] = useState<any[]>([]);
  const [hotDeals, setHotDeals] = useState<any[]>([]);
  const [addedToday, setAddedToday] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSlabs = async () => {
      try {
        setLoading(true);
        const promises = [
          slabService.getFeatured(8).catch(err => {
            console.error("Error loading featured:", err);
            return [];
          }),
          slabService.getHotDeals(8, user?.id).catch(err => {
            console.error("Error loading hot deals:", err);
            return [];
          }),
          slabService.getAddedToday(8).catch(err => {
            console.error("Error loading added today:", err);
            return [];
          }),
        ];

        // Add personalized recommendations if user is logged in
        if (user?.id) {
          promises.push(
            slabService.getPersonalizedRecommendations(user.id, 8).catch(err => {
              console.error("Error loading recommendations:", err);
              return [];
            })
          );
        }

        const results = await Promise.all(promises);
        setFeaturedSlabs(results[0] || []);
        setHotDeals(results[1] || []);
        setAddedToday(results[2] || []);
        if (user?.id && results[3]) {
          setRecommendations(results[3] || []);
        }
      } catch (error) {
        console.error("Error loading slabs:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSlabs();
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <MainHeader currentPage="home" />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-4" variant="secondary">
            Launching with Pokemon TCG • More Categories Coming Soon
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            {t('home.title')}
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
            {t('home.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8" asChild>
              <Link href="/marketplace">{t('home.browseMarketplace')}</Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8" asChild>
              <Link href="/sell">{t('home.startSelling')}</Link>
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              <span>{t('home.certificateVerified')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              <span>{t('home.escrowProtected')}</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <span>{t('home.marketAnalytics')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Grading Companies */}
      <section className="container mx-auto px-4 py-12 border-y bg-slate-50/50 dark:bg-slate-900/50">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-sm font-medium text-slate-600 dark:text-slate-400 mb-6">
            AUTHENTICATED SLABS FROM TRUSTED GRADING COMPANIES
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8">
            {["PSA", "BGS", "CGC", "SGC", "ACE"].map((company) => (
              <div key={company} className="text-2xl font-bold text-slate-400 dark:text-slate-600">
                {company}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Built for Collectors & Investors
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Everything you need to buy, sell, and track graded collectibles
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <ShieldCheck className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle>Real-Time Verification</CardTitle>
                <CardDescription>
                  Instant certificate validation with PSA, BGS, CGC, SGC, and more. 
                  Every slab verified against official databases.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Search className="h-10 w-10 text-purple-600 mb-2" />
                <CardTitle>Advanced Filtering</CardTitle>
                <CardDescription>
                  Search by grade, subgrades, certificate number, pop report, year, 
                  edition, and more. Find exactly what you&apos;re looking for.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Package className="h-10 w-10 text-green-600 mb-2" />
                <CardTitle>Secure Transactions</CardTitle>
                <CardDescription>
                  Escrow protection, insured shipping, and temperature-controlled 
                  delivery options for high-value items.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <TrendingUp className="h-10 w-10 text-orange-600 mb-2" />
                <CardTitle>Investment Analytics</CardTitle>
                <CardDescription>
                  Track price trends, market indices, ROI reports, and get 
                  price alerts on your watchlist items.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Star className="h-10 w-10 text-yellow-600 mb-2" />
                <CardTitle>Featured Listings</CardTitle>
                <CardDescription>
                  Hot deals, newly added slabs, and premium featured listings. 
                  Never miss a great opportunity.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Award className="h-10 w-10 text-pink-600 mb-2" />
                <CardTitle>Buyer Protection</CardTitle>
                <CardDescription>
                  Comprehensive buyer protection program with delivery guarantees, 
                  return policies, and transparent dispute resolution.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      <section className="container mx-auto px-4 py-12 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-yellow-600" />
              <div>
                <h2 className="text-3xl font-bold">{t('home.featuredListings')}</h2>
                <p className="text-slate-600 dark:text-slate-400">{t('home.featuredListingsDesc')}</p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link href="/marketplace">{t('common.view')} All</Link>
            </Button>
          </div>
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="p-0">
                    <div className="aspect-[3/4] bg-slate-200 dark:bg-slate-700 rounded-t-lg" />
                  </CardHeader>
                  <CardContent className="p-4 space-y-2">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                    <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : featuredSlabs.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredSlabs.map((slab) => (
                <SlabCard key={slab.id} slab={slab} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Sparkles className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                <p className="text-lg text-slate-600 dark:text-slate-400 mb-4">
                  No featured listings yet. Be the first to create one!
                </p>
                <Button asChild>
                  <Link href="/sell">Start Selling</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Recommended for You - Only show if user is logged in */}
      {user && (
        <section className="container mx-auto px-4 py-12 bg-gradient-to-b from-purple-50 to-white dark:from-purple-950/20 dark:to-slate-900">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Heart className="h-8 w-8 text-pink-600" />
                <div>
                  <h2 className="text-3xl font-bold">Recommended for You</h2>
                  <p className="text-slate-600 dark:text-slate-400">
                    Personalized picks based on your watchlist and purchase history
                  </p>
                </div>
              </div>
              <Button variant="outline" asChild>
                <Link href="/marketplace">{t('common.view')} All</Link>
              </Button>
            </div>
            {loading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader className="p-0">
                      <div className="aspect-[3/4] bg-slate-200 dark:bg-slate-700 rounded-t-lg" />
                    </CardHeader>
                    <CardContent className="p-4 space-y-2">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                      <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : recommendations.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {recommendations.map((slab) => (
                  <SlabCard key={slab.id} slab={slab} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Heart className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                  <p className="text-lg text-slate-600 dark:text-slate-400 mb-4">
                    Start adding items to your watchlist to get personalized recommendations!
                  </p>
                  <Button variant="outline" asChild>
                    <Link href="/marketplace">Browse Marketplace</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      )}

      {/* Hot Deals */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Flame className="h-8 w-8 text-orange-600" />
              <div>
                <h2 className="text-3xl font-bold">{t('home.hotDeals')}</h2>
                <p className="text-slate-600 dark:text-slate-400">
                  {user 
                    ? t('home.hotDealsDesc') + " (Personalized for you)"
                    : t('home.hotDealsDesc')
                  }
                </p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link href="/marketplace">{t('common.view')} All</Link>
            </Button>
          </div>
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="p-0">
                    <div className="aspect-[3/4] bg-slate-200 dark:bg-slate-700 rounded-t-lg" />
                  </CardHeader>
                  <CardContent className="p-4 space-y-2">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                    <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : hotDeals.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {hotDeals.map((slab) => (
                <SlabCard key={slab.id} slab={slab} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Flame className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                <p className="text-lg text-slate-600 dark:text-slate-400 mb-4">
                  No hot deals available yet. Check back soon!
                </p>
                <Button variant="outline" asChild>
                  <Link href="/marketplace">Browse Marketplace</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Added Today */}
      <section className="container mx-auto px-4 py-12 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-blue-600" />
              <div>
                <h2 className="text-3xl font-bold">{t('home.addedToday')}</h2>
                <p className="text-slate-600 dark:text-slate-400">{t('home.addedTodayDesc')}</p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link href="/marketplace">{t('common.view')} All</Link>
            </Button>
          </div>
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="p-0">
                    <div className="aspect-[3/4] bg-slate-200 dark:bg-slate-700 rounded-t-lg" />
                  </CardHeader>
                  <CardContent className="p-4 space-y-2">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                    <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : addedToday.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {addedToday.map((slab) => (
                <SlabCard key={slab.id} slab={slab} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Clock className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                <p className="text-lg text-slate-600 dark:text-slate-400 mb-4">
                  No new listings added today. Be the first!
                </p>
                <Button asChild>
                  <Link href="/sell">Start Selling</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Categories Preview */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Categories
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Starting with Pokemon TCG, expanding to more categories soon
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="text-center">Pokemon TCG</CardTitle>
                <CardDescription className="text-center">
                  <Badge>Available Now</Badge>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-square bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center text-white text-4xl font-bold">
                  ⚡
                </div>
              </CardContent>
            </Card>

            <Card className="opacity-60">
              <CardHeader>
                <CardTitle className="text-center">Disney Lorcana</CardTitle>
                <CardDescription className="text-center">
                  <Badge variant="outline">Coming Soon</Badge>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-square bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center text-white text-4xl font-bold">
                  ✨
                </div>
              </CardContent>
            </Card>

            <Card className="opacity-60">
              <CardHeader>
                <CardTitle className="text-center">Sports Cards</CardTitle>
                <CardDescription className="text-center">
                  <Badge variant="outline">Coming Soon</Badge>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-square bg-gradient-to-br from-blue-400 to-green-500 rounded-lg flex items-center justify-center text-white text-4xl font-bold">
                  🏀
                </div>
              </CardContent>
            </Card>

            <Card className="opacity-60">
              <CardHeader>
                <CardTitle className="text-center">Magic: The Gathering</CardTitle>
                <CardDescription className="text-center">
                  <Badge variant="outline">Coming Soon</Badge>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-square bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg flex items-center justify-center text-white text-4xl font-bold">
                  🔮
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Start Trading?
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
            Join the premier marketplace for authenticated graded collectibles
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8" asChild>
              <Link href="/auth/register">Create Account</Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8" asChild>
              <Link href="/about">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

// Slab Card Component for homepage sections
function SlabCard({ slab }: { slab: any }) {
  const t = useTranslations();
  const imageUrl = slab.images && Array.isArray(slab.images) && slab.images.length > 0 
    ? slab.images[0] 
    : null;

  return (
    <Card className="hover:shadow-xl transition-all duration-300 group cursor-pointer h-full">
      <Link href={`/slab/${slab.id}`}>
        <CardHeader className="p-0">
          <div className="relative aspect-[3/4] bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-t-lg overflow-hidden">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={slab.name || "Slab"}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-6xl">
                🃏
              </div>
            )}
            {slab.listing_type === "featured" && (
              <div className="absolute top-2 right-2">
                <Badge className="bg-yellow-600">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Featured
                </Badge>
              </div>
            )}
            {slab.grading_company && (
              <div className="absolute bottom-2 left-2">
                <Badge variant="secondary" className="text-xs">
                  {slab.grading_company.name || slab.grading_company.code} {slab.grade}
                </Badge>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
            {slab.name}
          </h3>
          {slab.set_name && (
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 line-clamp-1">
              {slab.set_name}
            </p>
          )}
          <div className="flex items-center justify-between mt-3">
            <span className="text-2xl font-bold text-blue-600">
              ${slab.price ? formatPrice(slab.price) : "N/A"}
            </span>
            {slab.cert_verified && (
              <Badge variant="outline" className="text-xs">
                <ShieldCheck className="h-3 w-3 mr-1 text-green-600" />
                Verified
              </Badge>
            )}
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
