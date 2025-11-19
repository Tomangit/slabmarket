import { useTranslations } from "next-intl";
import { MainHeader } from "@/components/MainHeader";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingCart, 
  Shield, 
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CreditCard,
  Package,
  MessageSquare
} from "lucide-react";
import Link from "next/link";

export default function BuyingHelpPage() {
  const t = useTranslations();

  const steps = [
    {
      number: 1,
      title: "Browse the marketplace",
      description: "Use the search and filters to find cards that interest you. You can filter by set, grade, price, and many other criteria.",
      icon: Search,
    },
    {
      number: 2,
      title: "Check listing details",
      description: "Review photos, certificate verification, price history, and market statistics. Check the seller's rating and reviews.",
      icon: CheckCircle2,
    },
    {
      number: 3,
      title: "Add to cart",
      description: "Click 'Add to cart' on the listing you want. You can add multiple products and complete your purchase at once.",
      icon: ShoppingCart,
    },
    {
      number: 4,
      title: "Proceed to checkout",
      description: "In your cart, review order details, choose payment and shipping methods. All transactions are protected by our escrow system.",
      icon: CreditCard,
    },
    {
      number: 5,
      title: "Receive your product",
      description: "After receiving the product, check that everything matches. Verify the certificate on the grading company's website.",
      icon: Package,
    },
    {
      number: 6,
      title: "Confirm receipt",
      description: "After verification, confirm receipt of the product. Payment will be released to the seller, and you can leave a review.",
      icon: CheckCircle2,
    },
  ];

  const safetyTips = [
    {
      title: "Always verify the certificate",
      description: "Use the certificate number to check authenticity on the grading company's website (PSA, BGS, CGC).",
      icon: Shield,
    },
    {
      title: "Check photos",
      description: "Carefully review all listing photos. Pay attention to the card condition, slab, and certificate.",
      icon: AlertTriangle,
    },
    {
      title: "Read the description",
      description: "Make sure the description matches the photos. Check all details, such as variants (1st Edition, Shadowless, etc.).",
      icon: MessageSquare,
    },
    {
      title: "Check the seller",
      description: "Review the seller's profile, ratings, and transaction history. Trusted sellers have verification and positive reviews.",
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <MainHeader />
      
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/help">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Help Center
            </Link>
          </Button>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <ShoppingCart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100">
              Buyer's Guide
            </h1>
          </div>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Learn how to safely buy on Slab Market
          </p>
        </div>

        {/* How to Buy Section */}
        <section id="how-to-buy" className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-slate-100">
            How to Buy?
          </h2>
          <div className="space-y-6">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <Card key={step.number} className="relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          {step.number}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                            {step.title}
                          </h3>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Buyer Protection */}
        <section className="mb-12">
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/30 dark:to-blue-950/30 border-green-200 dark:border-green-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
                <CardTitle>Buyer Protection</CardTitle>
              </div>
              <CardDescription>
                All transactions are protected by our system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold mb-1">Escrow System</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Payment is held in a secure escrow system until you confirm receipt of the product.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold mb-1">Certificate Verification</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    All certificates are automatically verified. You can also verify certificates manually.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold mb-1">Dispute Resolution</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    If something goes wrong, you can file a dispute. Our team will investigate and ensure a fair resolution.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold mb-1">Returns & Refunds</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    You have 7 days to request a return if the product doesn't match the description or is damaged.
                  </p>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-green-200 dark:border-green-800">
                <Button asChild>
                  <Link href="/verification">
                    Learn more about protection
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Safety Tips */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-slate-100">
            Safety Tips
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {safetyTips.map((tip, index) => {
              const Icon = tip.icon;
              return (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                        <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2 text-slate-900 dark:text-slate-100">
                          {tip.title}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {tip.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Related Links */}
        <Card>
          <CardHeader>
            <CardTitle>Related Topics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button variant="outline" asChild>
                <Link href="/verification">
                  <Shield className="mr-2 h-4 w-4" />
                  Certificate Verification
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/help/faq">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  FAQ
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/support/disputes">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Dispute Resolution
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
