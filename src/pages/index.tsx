
import React, { useState, useEffect, memo, useRef as ReactUseRef } from "react";
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
import { PriceDisplay } from "@/components/PriceDisplay";
import { useAuth } from "@/contexts/AuthContext";
import { SEO } from "@/components/SEO";
import { motion } from "framer-motion";

export default function HomePage() {
  const t = useTranslations();
  const { user } = useAuth();
  const [featuredSlabs, setFeaturedSlabs] = useState<any[]>([]);
  const [hotDeals, setHotDeals] = useState<any[]>([]);
  const [addedToday, setAddedToday] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // Render dynamic (client-fetched) sections only on client to avoid SSR/CSR mismatches
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

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
    <>
      <SEO
        title="Premium Marketplace for Graded Trading Cards"
        description="Buy and sell authenticated graded trading cards with confidence. Real-time certificate verification, escrow protection, and investment-grade analytics. PSA, BGS, CGC certified slabs."
        keywords={["graded cards", "trading cards", "Pokemon cards", "PSA", "BGS", "CGC", "slab market", "card marketplace", "authenticated cards", "graded collectibles"]}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Slab Market",
          url: process.env.NEXT_PUBLIC_SITE_URL || "https://slabmarket.com",
          description: "Premium marketplace for authenticated graded trading cards",
          potentialAction: {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: `${process.env.NEXT_PUBLIC_SITE_URL || "https://slabmarket.com"}/marketplace?search={search_term_string}`,
            },
            "query-input": "required name=search_term_string",
          },
        }}
      />
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <MainHeader currentPage="home" />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-4" variant="secondary">
            A curated marketplace for graded collectibles
          </Badge>
          <h1 className="text-5xl md:text-6xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 mb-6">
            {t('home.title')}
          </h1>
          <p className="text-xl leading-relaxed text-slate-700 dark:text-slate-300 mb-10 max-w-2xl mx-auto">
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
          
          {/* Flip Card on Scroll */}
          <div className="mt-16 flex justify-center">
            <FlipCardOnScroll />
          </div>
        </div>
      </section>

      

      {/* Trust/Assurances band (no vanity metrics) */}
      <section className="container mx-auto px-4 pb-12">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <div className="rounded-lg border bg-white dark:bg-slate-900 p-4 flex items-center justify-center gap-3">
              <ShieldCheck className="h-5 w-5 text-green-600" />
            <div className="text-sm text-slate-700 dark:text-slate-300">Buyer protection on every order</div>
            </div>
          <div className="rounded-lg border bg-white dark:bg-slate-900 p-4 flex items-center justify-center gap-3">
            <Lock className="h-5 w-5 text-blue-600" />
            <div className="text-sm text-slate-700 dark:text-slate-300">Escrow-secured transactions</div>
            </div>
          <div className="rounded-lg border bg-white dark:bg-slate-900 p-4 flex items-center justify-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-purple-600" />
            <div className="text-sm text-slate-700 dark:text-slate-300">Verified grading companies</div>
            </div>
          <div className="rounded-lg border bg-white dark:bg-slate-900 p-4 flex items-center justify-center gap-3">
            <UserCheck className="h-5 w-5 text-slate-600" />
            <div className="text-sm text-slate-700 dark:text-slate-300">Seller ratings & dispute support</div>
          </div>
        </div>
      </section>

      {/* Supported Grading Companies */}
      <section className="container mx-auto px-4 py-12 border-y bg-slate-50/50 dark:bg-slate-900/50">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-sm font-medium text-slate-600 dark:text-slate-400 mb-6 tracking-wide">
            Authenticated slabs from trusted grading companies
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8">
            {["PSA", "BGS", "CGC", "SGC", "ACE"].map((company) => (
              <div key={company} className="text-xl md:text-2xl font-semibold text-slate-400 dark:text-slate-600">
                {company}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Buyer Protection Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <ShieldCheck className="h-10 w-10 text-blue-600" />
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
                Your Safety is Our Priority
              </h2>
            </div>
            <p className="text-lg text-slate-700 dark:text-slate-300 max-w-3xl mx-auto mb-8">
              We've built multiple layers of protection to ensure you're buying authentic graded cards from trusted sellers. Scammers are immediately banned and never receive payment.
            </p>
            <Button size="lg" variant="secondary" asChild>
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
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
              Built for collectors and serious investors
            </h2>
            <p className="text-lg text-slate-700 dark:text-slate-300">
              Tools that make buying, selling, and tracking graded collectibles effortless
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-white dark:bg-slate-900">
              <CardHeader>
                <div className="h-10 w-10 mb-3 rounded-md bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5 text-blue-700 dark:text-blue-300" />
                </div>
                <CardTitle>Real-Time Verification</CardTitle>
                <CardDescription>
                  Instant certificate validation with PSA, BGS, CGC, SGC, and more. 
                  Every slab verified against official databases.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white dark:bg-slate-900">
              <CardHeader>
                <div className="h-10 w-10 mb-3 rounded-md bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
                  <Search className="h-5 w-5 text-purple-700 dark:text-purple-300" />
                </div>
                <CardTitle>Advanced Filtering</CardTitle>
                <CardDescription>
                  Search by grade, subgrades, certificate number, pop report, year, 
                  edition, and more. Find exactly what you&apos;re looking for.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white dark:bg-slate-900">
              <CardHeader>
                <div className="h-10 w-10 mb-3 rounded-md bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                  <Package className="h-5 w-5 text-green-700 dark:text-green-300" />
                </div>
                <CardTitle>Secure Transactions</CardTitle>
                <CardDescription>
                  Escrow protection, insured shipping, and temperature-controlled 
                  delivery options for high-value items.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white dark:bg-slate-900">
              <CardHeader>
                <div className="h-10 w-10 mb-3 rounded-md bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-orange-700 dark:text-orange-300" />
                </div>
                <CardTitle>Investment Analytics</CardTitle>
                <CardDescription>
                  Track price trends, market indices, ROI reports, and get 
                  price alerts on your watchlist items.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white dark:bg-slate-900">
              <CardHeader>
                <div className="h-10 w-10 mb-3 rounded-md bg-yellow-100 dark:bg-yellow-900/40 flex items-center justify-center">
                  <Star className="h-5 w-5 text-yellow-700 dark:text-yellow-300" />
                </div>
                <CardTitle>Featured Listings</CardTitle>
                <CardDescription>
                  Hot deals, newly added slabs, and premium featured listings. 
                  Never miss a great opportunity.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <CardHeader>
                <div className="h-10 w-10 mb-3 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Award className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                </div>
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
          {(!isClient || loading) ? (
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
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-blue-600" />
              <div>
                <h2 className="text-3xl font-semibold tracking-tight">{t('home.addedToday')}</h2>
                <p className="text-slate-700 dark:text-slate-300">{t('home.addedTodayDesc')}</p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link href="/marketplace">{t('common.view')} All</Link>
            </Button>
          </div>
          {(!isClient || loading) ? (
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
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
              Categories
            </h2>
            <p className="text-lg text-slate-700 dark:text-slate-300">
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
                <Link href="/marketplace?category=pokemon-tcg">
                  <div className="aspect-square rounded-lg border bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden">
                    <Image
                      src="https://upload.wikimedia.org/wikipedia/commons/9/98/International_Pok%C3%A9mon_logo.svg"
                      alt="Pokemon TCG Logo"
                      width={400}
                      height={200}
                      className="object-contain h-full w-full p-6"
                    />
                  </div>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="text-center">Disney Lorcana</CardTitle>
                <CardDescription className="text-center">
                  <Badge>Available Now</Badge>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/marketplace?category=disney-lorcana">
                  <div className="aspect-square rounded-lg border bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden">
                    <Image
                      src="/Disney_Lorcana_Logo.png"
                      alt="Disney Lorcana Logo"
                      width={400}
                      height={200}
                      className="object-contain h-full w-full p-6"
                      priority
                    />
                  </div>
                </Link>
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
                <div className="aspect-square rounded-lg border bg-white dark:bg-slate-900 flex items-center justify-center text-3xl">SC</div>
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
                <div className="aspect-square rounded-lg border bg-white dark:bg-slate-900 flex items-center justify-center text-3xl">MTG</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
            Ready to Start Trading?
          </h2>
          <p className="text-lg text-slate-700 dark:text-slate-300 mb-8">
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
    </>
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
              {slab.price ? (
                <PriceDisplay price={slab.price} fromCurrency={slab.currency || "USD"} />
              ) : (
                "N/A"
              )}
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

// Flip Card on Scroll Component
const FlipCardOnScroll = memo(function FlipCardOnScroll() {
  const [scrollY, setScrollY] = useState(0);
  const cardRef = ReactUseRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const cardTop = rect.top;
        const cardHeight = rect.height;
        const cardCenterY = cardTop + cardHeight / 2;
        const viewportCenterY = windowHeight / 2;
        
        // Calculate scroll progress - start flipping earlier (from 2nd scroll instead of 5th)
        // Start flipping when card is higher on screen (earlier trigger)
        // Complete flip when card center reaches viewport center
        // Larger range = starts earlier and completes over more scroll distance
        const flipRange = windowHeight * 0.7; // Increased from 0.4 to 0.7 for earlier start
        // Start flipping when card is above viewport center (earlier trigger)
        const startPoint = viewportCenterY + windowHeight * 0.3; // Start when card is higher
        const distanceFromStart = Math.max(0, startPoint - cardCenterY);
        const scrollProgress = Math.max(0, Math.min(1, distanceFromStart / flipRange));
        setScrollY(scrollProgress);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial call
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Calculate rotation based on scroll (0 to 180 degrees)
  // Start at 0 (front facing user), end at 180 (back facing user)
  // Ensure it starts at 0 and completes at 180
  const rotation = Math.max(0, Math.min(180, scrollY * 180));

  return (
    <div 
      ref={cardRef} 
      className="flex justify-center items-center py-16 gap-8 relative"
      style={{ 
        perspective: '1000px',
        minHeight: '500px',
      }}
    >
      {/* Apple Liquid Glass Background Effect */}
      <div 
        className="absolute inset-0 rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
        }}
      >
        {/* Animated gradient overlay */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 50%, rgba(236, 72, 153, 0.1) 100%)',
            animation: 'gradientShift 8s ease infinite',
            backgroundSize: '200% 200%',
          }}
        />
        
      </div>
      
      {/* Cards Container with glass effect */}
      <div className="relative z-10 flex justify-center items-center gap-8">
        {/* First Card - test.webp / test2.jpg */}
        <motion.div
          className="relative w-64 h-96 md:w-80 md:h-[28rem]"
          style={{
            transformStyle: 'preserve-3d',
          }}
          animate={{
            rotateY: rotation,
          }}
          transition={{
            type: 'tween',
            duration: 0.1,
            ease: 'linear',
          }}
        >
        {/* Front of card */}
        <div
          className="absolute inset-0 w-full h-full rounded-lg overflow-hidden"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(0deg)',
            transformOrigin: 'center center',
          }}
        >
          <Image
            src="/test.webp"
            alt="Card front"
            fill
            className="object-contain rounded-lg"
            priority
            sizes="(max-width: 768px) 256px, 320px"
          />
        </div>
        
        {/* Back of card */}
        <div
          className="absolute inset-0 w-full h-full rounded-lg overflow-hidden"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            transformOrigin: 'center center',
          }}
        >
          <Image
            src="/test2.jpg"
            alt="Card back"
            fill
            className="object-contain rounded-lg"
            sizes="(max-width: 768px) 256px, 320px"
          />
        </div>
        
        {/* Card edge/thickness (3mm) - visible during rotation */}
        <div
          className="absolute inset-0 rounded-lg"
          style={{
            transformStyle: 'preserve-3d',
            backfaceVisibility: 'hidden',
          }}
        >
          {/* Top edge */}
          <div
            className="absolute bg-slate-800 dark:bg-slate-700"
            style={{
              width: '100%',
              height: '3px',
              top: 0,
              left: 0,
              transform: 'rotateX(90deg)',
              transformOrigin: 'top center',
            }}
          />
          {/* Bottom edge */}
          <div
            className="absolute bg-slate-800 dark:bg-slate-700"
            style={{
              width: '100%',
              height: '3px',
              bottom: 0,
              left: 0,
              transform: 'rotateX(-90deg)',
              transformOrigin: 'bottom center',
            }}
          />
          {/* Left edge */}
          <div
            className="absolute bg-slate-800 dark:bg-slate-700"
            style={{
              width: '3px',
              height: '100%',
              left: 0,
              top: 0,
              transform: 'rotateY(-90deg)',
              transformOrigin: 'left center',
            }}
          />
          {/* Right edge */}
          <div
            className="absolute bg-slate-800 dark:bg-slate-700"
            style={{
              width: '3px',
              height: '100%',
              right: 0,
              top: 0,
              transform: 'rotateY(90deg)',
              transformOrigin: 'right center',
            }}
          />
        </div>
        </motion.div>

        {/* Second Card - czarek1.jpg / czarek2.jpg */}
        <motion.div
          className="relative w-64 h-96 md:w-80 md:h-[28rem]"
          style={{
            transformStyle: 'preserve-3d',
          }}
          animate={{
            rotateY: rotation,
          }}
          transition={{
            type: 'tween',
            duration: 0.1,
            ease: 'linear',
          }}
        >
        {/* Front of card */}
        <div
          className="absolute inset-0 w-full h-full rounded-lg overflow-hidden"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(0deg)',
            transformOrigin: 'center center',
          }}
        >
          <Image
            src="/czarek1.jpg"
            alt="Card front"
            fill
            className="object-contain rounded-lg"
            sizes="(max-width: 768px) 256px, 320px"
          />
        </div>
        
        {/* Back of card */}
        <div
          className="absolute inset-0 w-full h-full rounded-lg overflow-hidden"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            transformOrigin: 'center center',
          }}
        >
          <Image
            src="/czarek2.jpg"
            alt="Card back"
            fill
            className="object-contain rounded-lg"
            sizes="(max-width: 768px) 256px, 320px"
          />
        </div>
        
        {/* Card edge/thickness (3mm) - visible during rotation */}
        <div
          className="absolute inset-0 rounded-lg"
          style={{
            transformStyle: 'preserve-3d',
            backfaceVisibility: 'hidden',
          }}
        >
          {/* Top edge */}
          <div
            className="absolute bg-slate-800 dark:bg-slate-700"
            style={{
              width: '100%',
              height: '3px',
              top: 0,
              left: 0,
              transform: 'rotateX(90deg)',
              transformOrigin: 'top center',
            }}
          />
          {/* Bottom edge */}
          <div
            className="absolute bg-slate-800 dark:bg-slate-700"
            style={{
              width: '100%',
              height: '3px',
              bottom: 0,
              left: 0,
              transform: 'rotateX(-90deg)',
              transformOrigin: 'bottom center',
            }}
          />
          {/* Left edge */}
          <div
            className="absolute bg-slate-800 dark:bg-slate-700"
            style={{
              width: '3px',
              height: '100%',
              left: 0,
              top: 0,
              transform: 'rotateY(-90deg)',
              transformOrigin: 'left center',
            }}
          />
          {/* Right edge */}
          <div
            className="absolute bg-slate-800 dark:bg-slate-700"
            style={{
              width: '3px',
              height: '100%',
              right: 0,
              top: 0,
              transform: 'rotateY(90deg)',
              transformOrigin: 'right center',
            }}
          />
        </div>
        </motion.div>
      </div>
    </div>
  );
});
