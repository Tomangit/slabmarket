import { useTranslations } from "next-intl";
import { MainHeader } from "@/components/MainHeader";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Store, 
  Upload,
  DollarSign,
  Image as ImageIcon,
  FileSpreadsheet,
  TrendingUp,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import Link from "next/link";

export default function SellingHelpPage() {
  const t = useTranslations();

  const steps = [
    {
      number: 1,
      title: "Prepare certificate information",
      description: "Gather the certificate number, grading company (PSA, BGS, CGC), and grade. You can verify the certificate before listing.",
      icon: CheckCircle2,
    },
    {
      number: 2,
      title: "Select the card",
      description: "Search for the card in our database or add a new one if it doesn't exist. Select the set, card number, and all variants (1st Edition, Shadowless, etc.).",
      icon: Store,
    },
    {
      number: 3,
      title: "Add photos",
      description: "Upload high-quality photos of the card (front, back) and certificate. The more photos, the better - this increases buyer trust.",
      icon: ImageIcon,
    },
    {
      number: 4,
      title: "Set price",
      description: "Use our price recommendation tools to see current market prices. You can also check price history and trends.",
      icon: DollarSign,
    },
    {
      number: 5,
      title: "Publish listing",
      description: "After verification, your listing will appear in the marketplace. You can manage all listings from your seller dashboard.",
      icon: Upload,
    },
  ];

  const bulkTools = [
    {
      title: "CSV Import",
      description: "Import multiple listings at once using a CSV file. Perfect for sellers with a large number of slabs.",
      icon: FileSpreadsheet,
    },
    {
      title: "Export Listings",
      description: "Export all your listings to a CSV file. Useful for creating backups or analysis.",
      icon: FileSpreadsheet,
    },
    {
      title: "Bulk Price Updates",
      description: "Update prices for many listings at once using rules (e.g., increase all by 10%) or a CSV file.",
      icon: TrendingUp,
    },
  ];

  const tips = [
    "Use high-quality photos - this increases trust and sales",
    "Check current market prices before setting a price",
    "Add a detailed description - buyers appreciate information",
    "Regularly update prices to stay competitive",
    "Respond quickly to messages from buyers",
    "Use bulk tools to manage multiple listings",
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
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <Store className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100">
              Seller's Guide
            </h1>
          </div>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Learn how to effectively sell on Slab Market
          </p>
        </div>

        {/* How to List Section */}
        <section id="how-to-list" className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-slate-100">
            How to List a Slab?
          </h2>
          <div className="space-y-6">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <Card key={step.number} className="relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-600" />
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <span className="font-bold text-green-600 dark:text-green-400">
                          {step.number}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Icon className="h-5 w-5 text-green-600 dark:text-green-400" />
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
          <div className="mt-6">
            <Button asChild size="lg">
              <Link href="/sell">
                Start Selling
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Bulk Tools */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-slate-100">
            Bulk Management Tools
          </h2>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {bulkTools.map((tool, index) => {
              const Icon = tool.icon;
              return (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                        <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2 text-slate-900 dark:text-slate-100">
                          {tool.title}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {tool.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <Button variant="outline" asChild>
            <Link href="/dashboard/bulk">
              Go to Bulk Tools
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </section>

        {/* Pricing Tips */}
        <section className="mb-12">
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Price Recommendations
              </CardTitle>
              <CardDescription>
                Use our tools to set competitive prices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold mb-1">Check current market prices</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Use the "Get Price Recommendation" feature when creating a listing to see current prices for similar cards.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold mb-1">Analyze market trends</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Check the Trends page to see which cards are gaining value and which are losing.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold mb-1">Compare with competition</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Use the "Compare Prices" feature on the card page to see all available listings for a card.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Best Practices */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-slate-100">
            Best Practices
          </h2>
          <Card>
            <CardContent className="p-6">
              <ul className="space-y-3">
                {tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700 dark:text-slate-300">{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Fees */}
        <section className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Fees & Commissions</CardTitle>
              <CardDescription>
                Information about selling fees
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold mb-1">No listing fees</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    We don't charge fees for listing items. You only pay a commission on completed transactions.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold mb-1">Commission on sales</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Commission is charged only after a successful transaction. Exact rates can be found on the /pricing page.
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <Button variant="outline" asChild>
                  <Link href="/pricing">
                    View Fee Details
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Related Links */}
        <Card>
          <CardHeader>
            <CardTitle>Related Topics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button variant="outline" asChild>
                <Link href="/dashboard">
                  <Store className="mr-2 h-4 w-4" />
                  Seller Dashboard
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard/bulk">
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Bulk Tools
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/help/faq">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  FAQ
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
