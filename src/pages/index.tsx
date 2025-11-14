
import React, { useState, useEffect, memo } from "react";
import { useTranslations } from 'next-intl';
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, TrendingUp, Package, Search, Star, Award, Sparkles, Flame, Clock, Heart, Ban, CreditCard, Flag, Lock, UserCheck, CheckCircle2 } from "lucide-react";
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
              <Ban className="h-5 w-5 text-red-600" />
              <span>Scammers Banned</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-600" />
              <span>Seller Ratings</span>
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

      {/* Buyer Protection Section */}
      <section className="container mx-auto px-4 py-20 bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/20 dark:to-slate-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <ShieldCheck className="h-10 w-10 text-blue-600" />
              <h2 className="text-3xl md:text-4xl font-bold">
                Your Safety is Our Priority
              </h2>
            </div>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-8">
              We've built multiple layers of protection to ensure you're buying authentic graded cards from trusted sellers. Scammers are immediately banned and never receive payment.
            </p>
            <Button size="lg" variant="outline" asChild>
              <Link href="/verification">
                <ShieldCheck className="mr-2 h-5 w-5" />
                Learn About Buyer Protection
              </Link>
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card className="border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                    <Star className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">Seller Rating System</CardTitle>
                </div>
                <CardDescription>
                  Every seller has a rating based on transaction history. Check reviews before buying to ensure you're dealing with trusted sellers.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-red-200 dark:border-red-800 bg-white dark:bg-slate-900">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900">
                    <Ban className="h-6 w-6 text-red-600" />
                  </div>
                  <CardTitle className="text-lg">Scammer Protection</CardTitle>
                </div>
                <CardDescription>
                  Scammers and fraudulent sellers are immediately banned. We actively monitor for suspicious activity and take swift action.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-green-200 dark:border-green-800 bg-white dark:bg-slate-900">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                    <CreditCard className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle className="text-lg">Payment Protection</CardTitle>
                </div>
                <CardDescription>
                  If you report a scammer before payment is processed, we immediately block the payment. Scammers never receive money from fraudulent transactions.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-orange-200 dark:border-orange-800 bg-white dark:bg-slate-900">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900">
                    <Flag className="h-6 w-6 text-orange-600" />
                  </div>
                  <CardTitle className="text-lg">Easy Reporting</CardTitle>
                </div>
                <CardDescription>
                  Suspect a fake slab? Report it immediately through our dispute system. Our team reviews all reports and takes appropriate action.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                    <Lock className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">Escrow Protection</CardTitle>
                </div>
                <CardDescription>
                  All transactions are protected by our escrow system. Funds are held securely until you confirm receipt and authenticity.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-900">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                    <UserCheck className="h-6 w-6 text-purple-600" />
                  </div>
                  <CardTitle className="text-lg">Verified Sellers</CardTitle>
                </div>
                <CardDescription>
                  Look for verified seller badges. These sellers have undergone additional verification and have a proven track record.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="mt-8 p-6 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
            <div className="flex items-start gap-4">
              <CheckCircle2 className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-green-800 dark:text-green-400 mb-2">
                  Full Refund Guarantee
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300">
                  If you receive a fake slab, we'll work with you to get a full refund and take action against the seller. Our support team is available to help resolve any disputes.
                </p>
              </div>
            </div>
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

            <Card className="border-2 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <Award className="h-10 w-10 text-pink-600 mb-2" />
                <CardTitle>Buyer Protection</CardTitle>
                <CardDescription>
                  Comprehensive buyer protection program with delivery guarantees, 
                  return policies, and transparent dispute resolution.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/verification">
                    Learn More About Protection
                  </Link>
                </Button>
              </CardContent>
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
              <Link href="/verification">Learn More About Protection</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

// Slab Card Component for homepage sections
const SlabCard = memo(function SlabCard({ slab }: { slab: any }) {
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
              <Image
                src={imageUrl}
                alt={slab.name || "Slab"}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                loading="lazy"
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
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
});
