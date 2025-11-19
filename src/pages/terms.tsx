import { useTranslations } from "next-intl";
import { MainHeader } from "@/components/MainHeader";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText,
  ArrowLeft,
  Shield,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";

export default function TermsPage() {
  const t = useTranslations();

  const sections = [
    {
      title: "1. Acceptance of Terms",
      content: (
        <div className="space-y-3">
          <p>
            By accessing and using Slab Market ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these Terms of Service, please do not use our Service.
          </p>
          <p>
            We reserve the right to update, change, or replace any part of these Terms of Service by posting updates and changes to our website. It is your responsibility to check this page periodically for changes.
          </p>
        </div>
      ),
    },
    {
      title: "2. Description of Service",
      content: (
        <div className="space-y-3">
          <p>
            Slab Market is an online marketplace that connects buyers and sellers of authenticated graded collectible cards (slabs). We provide a platform for listing, browsing, and purchasing graded cards, along with payment processing, escrow services, and buyer protection programs.
          </p>
          <p>
            We are not a party to any transaction between buyers and sellers. We act as an intermediary to facilitate transactions and provide services that support the marketplace.
          </p>
        </div>
      ),
    },
    {
      title: "3. User Accounts",
      content: (
        <div className="space-y-3">
          <p>
            To use certain features of our Service, you must register for an account. You agree to:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Provide accurate, current, and complete information during registration</li>
            <li>Maintain and promptly update your account information</li>
            <li>Maintain the security of your password and identification</li>
            <li>Accept all responsibility for activities that occur under your account</li>
            <li>Notify us immediately of any unauthorized use of your account</li>
          </ul>
          <p>
            You must be at least 18 years old to create an account and use our Service.
          </p>
        </div>
      ),
    },
    {
      title: "4. Buyer Responsibilities",
      content: (
        <div className="space-y-3">
          <p>
            As a buyer, you agree to:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Pay for items you purchase in a timely manner</li>
            <li>Inspect items upon receipt and verify authenticity</li>
            <li>Report any issues within 7 days of receipt</li>
            <li>Confirm receipt when satisfied with the purchase</li>
            <li>Leave accurate and honest reviews</li>
          </ul>
        </div>
      ),
    },
    {
      title: "5. Seller Responsibilities",
      content: (
        <div className="space-y-3">
          <p>
            As a seller, you agree to:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Provide accurate descriptions and photos of items</li>
            <li>Verify all certificate numbers before listing</li>
            <li>Ship items promptly after payment is confirmed</li>
            <li>Use secure, insured shipping methods</li>
            <li>Respond to buyer inquiries in a timely manner</li>
            <li>Honor all sale commitments</li>
          </ul>
        </div>
      ),
    },
    {
      title: "6. Fees and Payments",
      content: (
        <div className="space-y-3">
          <p>
            There are no fees for listing items on Slab Market. We charge the following fees on completed transactions:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Marketplace Fee:</strong> 5% of the sale price (charged to seller)</li>
            <li><strong>Payment Processing Fee:</strong> 2.9% + $0.30 per transaction (charged to seller)</li>
            <li><strong>Featured Listing:</strong> $50 per week (optional, charged to seller)</li>
          </ul>
          <p>
            Buyers pay the listed price plus shipping costs. No additional fees are charged to buyers.
          </p>
          <p>
            All fees are clearly displayed before completing a transaction. Fees are deducted from the seller's payment.
          </p>
        </div>
      ),
    },
    {
      title: "7. Escrow and Payment Protection",
      content: (
        <div className="space-y-3">
          <p>
            We use an escrow system to protect both buyers and sellers. When a buyer purchases an item:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Payment is held in escrow until the buyer confirms receipt</li>
            <li>Funds are released to the seller after buyer confirmation</li>
            <li>If there is a dispute, funds are held until resolution</li>
            <li>Buyers have 7 days to inspect and verify items</li>
          </ul>
        </div>
      ),
    },
    {
      title: "8. Buyer Protection",
      content: (
        <div className="space-y-3">
          <p>
            We offer buyer protection for eligible transactions:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Full refund if item doesn't match description</li>
            <li>Full refund if item is damaged or fake</li>
            <li>Protection against non-delivery</li>
            <li>7-day return window after receipt</li>
          </ul>
          <p>
            To be eligible for buyer protection, you must report issues within 7 days of receipt and provide evidence of the problem.
          </p>
        </div>
      ),
    },
    {
      title: "9. Prohibited Items and Activities",
      content: (
        <div className="space-y-3">
          <p>
            You agree not to:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>List fake or counterfeit items</li>
            <li>Use fake certificate numbers</li>
            <li>Misrepresent items or conditions</li>
            <li>Engage in fraudulent activities</li>
            <li>Circumvent fees or payment systems</li>
            <li>Interfere with the Service or other users</li>
            <li>Violate any applicable laws or regulations</li>
          </ul>
          <p>
            Violation of these terms may result in account suspension or termination, and legal action if necessary.
          </p>
        </div>
      ),
    },
    {
      title: "10. Dispute Resolution",
      content: (
        <div className="space-y-3">
          <p>
            If you have a dispute with another user:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>First, attempt to resolve the issue directly with the other party</li>
            <li>If resolution is not possible, file a dispute through our system</li>
            <li>Our support team will investigate and make a decision</li>
            <li>Both parties will have the opportunity to present evidence</li>
          </ul>
          <p>
            Our decisions on disputes are final and binding. We reserve the right to issue refunds, suspend accounts, or take other appropriate actions.
          </p>
        </div>
      ),
    },
    {
      title: "11. Intellectual Property",
      content: (
        <div className="space-y-3">
          <p>
            The Service and its original content, features, and functionality are owned by Slab Market and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
          </p>
          <p>
            You may not reproduce, distribute, modify, or create derivative works of any content from our Service without our express written permission.
          </p>
        </div>
      ),
    },
    {
      title: "12. Limitation of Liability",
      content: (
        <div className="space-y-3">
          <p>
            To the maximum extent permitted by law, Slab Market shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses.
          </p>
          <p>
            Our total liability for any claims arising from or related to the Service shall not exceed the amount you paid to us in the 12 months preceding the claim.
          </p>
        </div>
      ),
    },
    {
      title: "13. Termination",
      content: (
        <div className="space-y-3">
          <p>
            We may terminate or suspend your account immediately, without prior notice, for any reason, including breach of these Terms of Service.
          </p>
          <p>
            Upon termination, your right to use the Service will cease immediately. All outstanding transactions will be resolved according to these terms.
          </p>
        </div>
      ),
    },
    {
      title: "14. Governing Law",
      content: (
        <div className="space-y-3">
          <p>
            These Terms of Service shall be governed by and construed in accordance with the laws of [Your Jurisdiction], without regard to its conflict of law provisions.
          </p>
          <p>
            Any disputes arising from these terms shall be resolved in the courts of [Your Jurisdiction].
          </p>
        </div>
      ),
    },
    {
      title: "15. Changes to Terms",
      content: (
        <div className="space-y-3">
          <p>
            We reserve the right to modify or replace these Terms of Service at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.
          </p>
          <p>
            What constitutes a material change will be determined at our sole discretion. Continued use of the Service after any changes constitutes acceptance of the new terms.
          </p>
        </div>
      ),
    },
    {
      title: "16. Contact Information",
      content: (
        <div className="space-y-3">
          <p>
            If you have any questions about these Terms of Service, please contact us:
          </p>
          <ul className="list-none space-y-1 ml-4">
            <li><strong>Email:</strong> legal@slabmarket.com</li>
            <li><strong>Support:</strong> support@slabmarket.com</li>
          </ul>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <MainHeader />
      
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100">
              Terms of Service
            </h1>
          </div>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Introduction */}
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <p className="text-slate-700 dark:text-slate-300">
              Please read these Terms of Service carefully before using Slab Market. By using our Service, you agree to be bound by these terms. If you do not agree to these terms, please do not use our Service.
            </p>
          </CardContent>
        </Card>

        {/* Terms Sections */}
        <div className="space-y-6">
          {sections.map((section, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-slate-100">
                  {section.title}
                </h2>
                <div className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  {section.content}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Acceptance */}
        <Card className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/30 dark:to-blue-950/30 border-green-200 dark:border-green-800">
          <CardContent className="p-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">
              Acceptance of Terms
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              By using Slab Market, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild>
                <Link href="/auth/register">
                  Create Account
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/contact">
                  Contact Us
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

