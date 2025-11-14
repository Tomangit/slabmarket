
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MainHeader } from "@/components/MainHeader";
import { Footer } from "@/components/Footer";
import { ShieldCheck, Users, Globe, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <MainHeader currentPage="about" />

      <section className="container mx-auto px-4 py-20 flex-1">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6">
            The Future of <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Graded Card Trading</span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-8">
            We&apos;re building the most trusted marketplace for authenticated graded collectibles, 
            starting with Pokemon TCG and expanding to all major trading card categories.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Our Mission</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-700 dark:text-slate-300">
              <p>
                Slab Market was founded by collectors, for collectors. We understand the challenges 
                of buying and selling high-value graded cards: concerns about authenticity, safe shipping, 
                secure payments, and fair pricing.
              </p>
              <p>
                Our mission is to create the most transparent, secure, and efficient marketplace for 
                graded collectibles, where buyers can shop with confidence and sellers can reach serious 
                collectors and investors worldwide.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How Slab Market Works</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">For Buyers</CardTitle>
                <CardDescription>Shop with confidence</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center shrink-0">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Browse Verified Listings</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Every slab is verified against official grading company databases
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center shrink-0">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Secure Purchase</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Escrow protection holds payment until you confirm receipt
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center shrink-0">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Insured Delivery</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Temperature-controlled shipping options for high-value items
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center shrink-0">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Buyer Protection</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Full refund if item doesn&apos;t match description or arrives damaged
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">For Sellers</CardTitle>
                <CardDescription>Reach serious collectors</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center shrink-0">
                    <CheckCircle className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold mb-1">List Your Slabs</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Quick listing process with automatic certificate verification
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center shrink-0">
                    <CheckCircle className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Competitive Fees</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Transparent 5% marketplace fee with no hidden costs
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center shrink-0">
                    <CheckCircle className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Seller Tools</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Bulk import, price analytics, and inventory management
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center shrink-0">
                    <CheckCircle className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Fast Payouts</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Funds released immediately upon buyer confirmation
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Our Core Values</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <ShieldCheck className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle>Trust & Security</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-400">
                  Every transaction is protected with escrow, certificate verification, 
                  and comprehensive buyer protection programs.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-10 w-10 text-purple-600 mb-2" />
                <CardTitle>Community First</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-400">
                  Built by collectors for collectors. We listen to our community and 
                  continuously improve based on your feedback.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Globe className="h-10 w-10 text-green-600 mb-2" />
                <CardTitle>Global Reach</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-400">
                  Connect with collectors and investors worldwide. Multi-currency support 
                  and international shipping options.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Join?</h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
            Start buying and selling authenticated graded collectibles today
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/auth/register">Create Account</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/marketplace">Browse Marketplace</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
