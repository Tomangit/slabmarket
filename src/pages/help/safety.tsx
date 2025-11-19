import { useTranslations } from "next-intl";
import { MainHeader } from "@/components/MainHeader";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Shield, 
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Eye,
  FileCheck,
  ArrowLeft,
  ArrowRight,
  ExternalLink
} from "lucide-react";
import Link from "next/link";

export default function SafetyHelpPage() {
  const t = useTranslations();

  const protectionFeatures = [
    {
      title: "Escrow System",
      description: "Payment is held in a secure escrow system until the buyer confirms receipt of the product. This ensures security for both parties in the transaction.",
      icon: Lock,
    },
    {
      title: "Certificate Verification",
      description: "All certificates are automatically verified by our system. We check the certificate number in the grading companies' databases (PSA, BGS, CGC).",
      icon: FileCheck,
    },
    {
      title: "Buyer Protection",
      description: "If the product doesn't match the description or is damaged, you can request a return within 7 days. Our team will investigate and ensure a fair resolution.",
      icon: Shield,
    },
    {
      title: "Dispute Resolution",
      description: "If problems arise, you can file a dispute. Our support team will investigate and provide a solution that benefits both parties.",
      icon: AlertTriangle,
    },
  ];

  const verificationSteps = [
    "Check the certificate number on the grading company's website",
    "Compare certificate photos with original designs",
    "Pay attention to print quality and holograms",
    "Check that all details match",
  ];

  const redFlags = [
    "Certificate cannot be verified on the grading company's website",
    "Photos are blurry or suspicious",
    "Price is significantly lower than market value",
    "Seller has negative reviews or no history",
    "Description doesn't match the photos",
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
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100">
              Protection & Safety
            </h1>
          </div>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Learn how our protection and safety systems work
          </p>
        </div>

        {/* Protection Features */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-slate-100">
            Protection Systems
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {protectionFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                        <Icon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2 text-slate-900 dark:text-slate-100">
                          {feature.title}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Certificate Verification */}
        <section className="mb-12">
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5" />
                Certificate Verification
              </CardTitle>
              <CardDescription>
                How to verify certificate authenticity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-3 text-slate-900 dark:text-slate-100">
                  Verification steps:
                </h4>
                <ul className="space-y-2">
                  {verificationSteps.map((step, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700 dark:text-slate-300">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-6 pt-6 border-t border-blue-200 dark:border-blue-800">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button asChild>
                    <Link href="/verification">
                      <Eye className="mr-2 h-4 w-4" />
                      Verification Guide
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <a
                      href="https://www.psacard.com/cert/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Verify PSA Certificate
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Red Flags */}
        <section className="mb-12">
          <Alert className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertTitle className="text-red-900 dark:text-red-100">
              Red Flags - What to Watch For
            </AlertTitle>
            <AlertDescription className="mt-2">
              <ul className="space-y-2">
                {redFlags.map((flag, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <span className="text-red-800 dark:text-red-200">{flag}</span>
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        </section>

        {/* What to Do */}
        <section className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle>What to Do If Something Goes Wrong?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">1</span>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Contact the seller</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    First, try to resolve the issue directly with the seller through the messaging system.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">2</span>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">File a dispute</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    If you can't resolve the issue, file a dispute through the "Disputes" section. Our team will investigate.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">3</span>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Case review</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Our team will review all evidence and provide a fair solution. You may receive a refund or product exchange.
                  </p>
                </div>
              </div>
              <div className="mt-6">
                <Button asChild>
                  <Link href="/support/disputes">
                    Report an Issue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Data Security */}
        <section className="mb-12">
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/30 dark:to-blue-950/30 border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Data Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold mb-1">Data Encryption</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    All data is encrypted during transmission and storage.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold mb-1">Secure Payments</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Payments are processed by trusted providers with security certifications.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold mb-1">Privacy</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    We never share your personal data with third parties without your consent.
                  </p>
                </div>
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
                <Link href="/verification">
                  <Shield className="mr-2 h-4 w-4" />
                  Certificate Verification
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/support/disputes">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Dispute Resolution
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/help/faq">
                  <FileCheck className="mr-2 h-4 w-4" />
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
