import { useTranslations } from "next-intl";
import { MainHeader } from "@/components/MainHeader";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShoppingCart,
  Store,
  CreditCard,
  Package,
  TrendingUp,
  ArrowRight,
  Info
} from "lucide-react";
import Link from "next/link";

export default function PricingPage() {
  const t = useTranslations();

  const exampleCalculations = [
    { price: 100, label: "$100 sale" },
    { price: 500, label: "$500 sale" },
    { price: 1000, label: "$1,000 sale" },
    { price: 5000, label: "$5,000 sale" },
  ];

  const calculateSellerReceives = (price: number) => {
    const marketplaceFee = price * 0.05; // 5%
    const paymentProcessingFee = price * 0.029 + 0.30; // 2.9% + $0.30
    const sellerReceives = price - marketplaceFee - paymentProcessingFee;
    return {
      marketplaceFee: Math.round(marketplaceFee * 100) / 100,
      paymentProcessingFee: Math.round(paymentProcessingFee * 100) / 100,
      sellerReceives: Math.round(sellerReceives * 100) / 100,
    };
  };

  const shippingRates = [
    { maxValue: 100, cost: 8.00, label: "Under $100" },
    { maxValue: 500, cost: 12.00, label: "$100 - $500" },
    { maxValue: 1000, cost: 18.00, label: "$500 - $1,000" },
    { maxValue: 2500, cost: 25.00, label: "$1,000 - $2,500" },
    { maxValue: 5000, cost: 35.00, label: "$2,500 - $5,000" },
    { maxValue: Infinity, cost: 50.00, label: "Over $5,000" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <MainHeader />
      
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
            <DollarSign className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold mb-4 text-slate-900 dark:text-slate-100">
            Pricing & Fees
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Transparent pricing with no hidden fees. Only pay when you make a sale.
          </p>
        </div>

        {/* Key Points */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800">
            <CardContent className="p-6 text-center">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-3" />
              <h3 className="font-semibold text-lg mb-2 text-slate-900 dark:text-slate-100">
                No Listing Fees
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                List as many items as you want for free. Only pay when you make a sale.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
              <h3 className="font-semibold text-lg mb-2 text-slate-900 dark:text-slate-100">
                Competitive Rates
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                5% marketplace fee + payment processing. Lower than most platforms.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200 dark:border-purple-800">
            <CardContent className="p-6 text-center">
              <CreditCard className="h-8 w-8 text-purple-600 dark:text-purple-400 mx-auto mb-3" />
              <h3 className="font-semibold text-lg mb-2 text-slate-900 dark:text-slate-100">
                Secure Payments
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                All transactions protected by escrow. Get paid after buyer confirms receipt.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Seller Fees */}
        <section className="mb-12">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Store className="h-6 w-6 text-green-600 dark:text-green-400" />
                <CardTitle className="text-2xl">Seller Fees</CardTitle>
              </div>
              <CardDescription>
                What you pay when you sell on Slab Market
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Fee Structure */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold mb-1 text-slate-900 dark:text-slate-100">
                        Listing Fee
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        <span className="font-bold text-green-600 dark:text-green-400">FREE</span> - No charge for listing items
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold mb-1 text-slate-900 dark:text-slate-100">
                        Marketplace Fee
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        <span className="font-bold">5%</span> of sale price - Only charged on completed transactions
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold mb-1 text-slate-900 dark:text-slate-100">
                        Payment Processing Fee
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        <span className="font-bold">2.9%</span> + <span className="font-bold">$0.30</span> per transaction
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold mb-1 text-slate-900 dark:text-slate-100">
                        Featured Listing (Optional)
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        <span className="font-bold">$50/week</span> - Boost your listing visibility
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-6">
                  <h4 className="font-semibold mb-4 text-slate-900 dark:text-slate-100">
                    Example Calculation
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Sale Price:</span>
                      <span className="font-semibold">$1,000.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Marketplace Fee (5%):</span>
                      <span className="font-semibold text-red-600">-$50.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Payment Processing (2.9% + $0.30):</span>
                      <span className="font-semibold text-red-600">-$29.30</span>
                    </div>
                    <div className="border-t pt-3 mt-3 flex justify-between">
                      <span className="font-bold text-slate-900 dark:text-slate-100">You Receive:</span>
                      <span className="font-bold text-green-600 text-lg">$920.70</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Example Calculations Table */}
              <div>
                <h4 className="font-semibold mb-4 text-slate-900 dark:text-slate-100">
                  Fee Calculator
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">Sale Price</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">Marketplace Fee</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">Processing Fee</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">You Receive</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exampleCalculations.map((example) => {
                        const fees = calculateSellerReceives(example.price);
                        return (
                          <tr key={example.price} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">{example.label}</td>
                            <td className="py-3 px-4 text-right text-red-600 dark:text-red-400">-${fees.marketplaceFee.toFixed(2)}</td>
                            <td className="py-3 px-4 text-right text-red-600 dark:text-red-400">-${fees.paymentProcessingFee.toFixed(2)}</td>
                            <td className="py-3 px-4 text-right font-bold text-green-600 dark:text-green-400">${fees.sellerReceives.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Buyer Fees */}
        <section className="mb-12">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <ShoppingCart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <CardTitle className="text-2xl">Buyer Fees</CardTitle>
              </div>
              <CardDescription>
                What you pay when you buy on Slab Market
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold mb-1 text-slate-900 dark:text-slate-100">
                    No Buyer Fees
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    You only pay the listed price plus shipping. No hidden fees, no markups.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold mb-1 text-slate-900 dark:text-slate-100">
                    Shipping Costs
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    Shipping costs vary based on item value and shipping options:
                  </p>
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4">
                    <div className="grid sm:grid-cols-2 gap-3 text-sm">
                      {shippingRates.map((rate, index) => (
                        <div key={index} className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">{rate.label}:</span>
                          <span className="font-semibold text-slate-900 dark:text-slate-100">${rate.cost.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        * Insurance (1.5% of value, min $5, max $200) and expedited shipping ($15) available as options
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Payment Timeline */}
        <section className="mb-12">
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Timeline
              </CardTitle>
              <CardDescription>
                When you get paid as a seller
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1 text-slate-900 dark:text-slate-100">
                      Buyer Places Order
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Payment is held in escrow. You'll receive a notification.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1 text-slate-900 dark:text-slate-100">
                      You Ship the Item
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Ship the item and update the tracking information.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1 text-slate-900 dark:text-slate-100">
                      Buyer Confirms Receipt
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      After the buyer confirms receipt and verifies the product, payment is released.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1 text-slate-900 dark:text-slate-100">
                      You Receive Payment
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Payment is transferred to your account (usually 2-5 business days after confirmation).
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* FAQ Section */}
        <section className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2 text-slate-900 dark:text-slate-100">
                  Are there any hidden fees?
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  No. All fees are clearly displayed before you list or purchase. The only fees are the marketplace fee (5%) and payment processing (2.9% + $0.30) for sellers, and shipping costs for buyers.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-slate-900 dark:text-slate-100">
                  When do I pay fees as a seller?
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Fees are only deducted from your payment after a successful sale. If the transaction doesn't complete, you don't pay anything.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-slate-900 dark:text-slate-100">
                  Can I get a refund if I'm not satisfied?
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Yes. Buyers have 7 days to request a return if the product doesn't match the description or is damaged. All returns are reviewed by our support team.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-slate-900 dark:text-slate-100">
                  How long does it take to receive payment?
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Payment is typically released 2-5 business days after the buyer confirms receipt of the product.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* CTA */}
        <div className="text-center">
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4">Ready to Start Selling?</h2>
              <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                Join thousands of sellers on Slab Market. List your first item for free and start earning today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/sell">
                    Start Selling
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20" asChild>
                  <Link href="/help/selling">
                    Seller Guide
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}

