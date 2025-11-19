import { useTranslations } from "next-intl";
import { MainHeader } from "@/components/MainHeader";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Shield,
  ArrowLeft,
  Lock,
  Eye,
  User,
  Database,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";

export default function PrivacyPage() {
  const t = useTranslations();

  const sections = [
    {
      title: "1. Introduction",
      content: (
        <div className="space-y-3">
          <p>
            At Slab Market ("we", "us", "our"), we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service.
          </p>
          <p>
            Please read this Privacy Policy carefully. If you do not agree with the terms of this Privacy Policy, please do not use our Service.
          </p>
        </div>
      ),
    },
    {
      title: "2. Information We Collect",
      content: (
        <div className="space-y-3">
          <p>
            We collect information that you provide directly to us and information that is automatically collected when you use our Service.
          </p>
          <h4 className="font-semibold mt-4 mb-2 text-slate-900 dark:text-slate-100">Information You Provide:</h4>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Account Information:</strong> Name, email address, password, and profile information</li>
            <li><strong>Transaction Information:</strong> Payment details, shipping addresses, and purchase history</li>
            <li><strong>Listing Information:</strong> Items you list for sale, including photos and descriptions</li>
            <li><strong>Communication:</strong> Messages sent through our platform and communications with support</li>
            <li><strong>Verification Documents:</strong> Identity verification documents (if required)</li>
          </ul>
          <h4 className="font-semibold mt-4 mb-2 text-slate-900 dark:text-slate-100">Automatically Collected Information:</h4>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Usage Data:</strong> Pages visited, time spent, and features used</li>
            <li><strong>Device Information:</strong> IP address, browser type, device type, and operating system</li>
            <li><strong>Cookies and Tracking:</strong> Cookies and similar tracking technologies</li>
            <li><strong>Location Data:</strong> General location based on IP address (if permitted)</li>
          </ul>
        </div>
      ),
    },
    {
      title: "3. How We Use Your Information",
      content: (
        <div className="space-y-3">
          <p>We use the information we collect for the following purposes:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>To provide, maintain, and improve our Service</li>
            <li>To process transactions and facilitate payments</li>
            <li>To verify identities and prevent fraud</li>
            <li>To communicate with you about your account, transactions, and our Service</li>
            <li>To send you marketing communications (with your consent)</li>
            <li>To personalize your experience</li>
            <li>To detect, prevent, and address technical issues</li>
            <li>To comply with legal obligations</li>
            <li>To enforce our terms and policies</li>
          </ul>
        </div>
      ),
    },
    {
      title: "4. Information Sharing and Disclosure",
      content: (
        <div className="space-y-3">
          <p>We do not sell your personal information. We may share your information in the following circumstances:</p>
          <h4 className="font-semibold mt-4 mb-2 text-slate-900 dark:text-slate-100">With Other Users:</h4>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>When you make a transaction, we share necessary information (name, shipping address) with the other party</li>
            <li>Your public profile information is visible to other users</li>
          </ul>
          <h4 className="font-semibold mt-4 mb-2 text-slate-900 dark:text-slate-100">With Service Providers:</h4>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Payment processors to handle transactions</li>
            <li>Shipping companies to deliver items</li>
            <li>Cloud hosting and analytics providers</li>
            <li>Customer support and email services</li>
          </ul>
          <h4 className="font-semibold mt-4 mb-2 text-slate-900 dark:text-slate-100">Legal Requirements:</h4>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>To comply with legal obligations or court orders</li>
            <li>To protect our rights and property</li>
            <li>To prevent fraud or illegal activities</li>
            <li>To protect the safety of our users</li>
          </ul>
          <h4 className="font-semibold mt-4 mb-2 text-slate-900 dark:text-slate-100">Business Transfers:</h4>
          <p>
            If we are involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.
          </p>
        </div>
      ),
    },
    {
      title: "5. Data Security",
      content: (
        <div className="space-y-3">
          <p>
            We implement appropriate technical and organizational measures to protect your personal information:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Encryption of data in transit and at rest</li>
            <li>Secure servers and databases</li>
            <li>Regular security assessments and updates</li>
            <li>Access controls and authentication</li>
            <li>Employee training on data protection</li>
          </ul>
          <p>
            However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
          </p>
        </div>
      ),
    },
    {
      title: "6. Your Rights and Choices",
      content: (
        <div className="space-y-3">
          <p>You have the following rights regarding your personal information:</p>
          <h4 className="font-semibold mt-4 mb-2 text-slate-900 dark:text-slate-100">Access and Portability:</h4>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Request access to your personal information</li>
            <li>Download a copy of your data</li>
          </ul>
          <h4 className="font-semibold mt-4 mb-2 text-slate-900 dark:text-slate-100">Correction and Deletion:</h4>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Update or correct your account information</li>
            <li>Request deletion of your account and data</li>
          </ul>
          <h4 className="font-semibold mt-4 mb-2 text-slate-900 dark:text-slate-100">Marketing Communications:</h4>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Opt-out of marketing emails (you can still receive transactional emails)</li>
            <li>Manage communication preferences in your account settings</li>
          </ul>
          <h4 className="font-semibold mt-4 mb-2 text-slate-900 dark:text-slate-100">Cookies:</h4>
          <p>
            You can control cookies through your browser settings. However, disabling cookies may limit your ability to use certain features of our Service.
          </p>
        </div>
      ),
    },
    {
      title: "7. Cookies and Tracking Technologies",
      content: (
        <div className="space-y-3">
          <p>
            We use cookies and similar tracking technologies to collect and store information about your use of our Service:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Essential Cookies:</strong> Required for the Service to function (e.g., authentication)</li>
            <li><strong>Analytics Cookies:</strong> Help us understand how users interact with our Service</li>
            <li><strong>Functional Cookies:</strong> Remember your preferences and settings</li>
            <li><strong>Marketing Cookies:</strong> Used to deliver relevant advertisements (with consent)</li>
          </ul>
          <p>
            You can control cookies through your browser settings. Note that disabling certain cookies may affect Service functionality.
          </p>
        </div>
      ),
    },
    {
      title: "8. Data Retention",
      content: (
        <div className="space-y-3">
          <p>
            We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law.
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Account Information:</strong> Retained while your account is active and for a period after closure as required by law</li>
            <li><strong>Transaction Records:</strong> Retained for at least 7 years for tax and legal compliance</li>
            <li><strong>Marketing Data:</strong> Retained until you opt-out or request deletion</li>
          </ul>
          <p>
            When you request account deletion, we will delete or anonymize your information, except where we are required to retain it for legal purposes.
          </p>
        </div>
      ),
    },
    {
      title: "9. Children's Privacy",
      content: (
        <div className="space-y-3">
          <p>
            Our Service is not intended for users under the age of 18. We do not knowingly collect personal information from children under 18.
          </p>
          <p>
            If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately. If we discover that we have collected information from a child under 18, we will delete that information promptly.
          </p>
        </div>
      ),
    },
    {
      title: "10. International Data Transfers",
      content: (
        <div className="space-y-3">
          <p>
            Your information may be transferred to and processed in countries other than your country of residence. These countries may have data protection laws that differ from those in your country.
          </p>
          <p>
            We ensure that appropriate safeguards are in place to protect your information when it is transferred internationally, including using standard contractual clauses approved by relevant data protection authorities.
          </p>
        </div>
      ),
    },
    {
      title: "11. Third-Party Links",
      content: (
        <div className="space-y-3">
          <p>
            Our Service may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties. We encourage you to read the privacy policies of any third-party websites you visit.
          </p>
        </div>
      ),
    },
    {
      title: "12. California Privacy Rights",
      content: (
        <div className="space-y-3">
          <p>
            If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA):
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Right to know what personal information is collected</li>
            <li>Right to know if personal information is sold or disclosed</li>
            <li>Right to opt-out of the sale of personal information</li>
            <li>Right to access your personal information</li>
            <li>Right to request deletion of your personal information</li>
            <li>Right to non-discrimination for exercising your privacy rights</li>
          </ul>
        </div>
      ),
    },
    {
      title: "13. GDPR Rights (European Users)",
      content: (
        <div className="space-y-3">
          <p>
            If you are located in the European Economic Area (EEA), you have additional rights under the General Data Protection Regulation (GDPR):
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Right of access to your personal data</li>
            <li>Right to rectification of inaccurate data</li>
            <li>Right to erasure ("right to be forgotten")</li>
            <li>Right to restrict processing</li>
            <li>Right to data portability</li>
            <li>Right to object to processing</li>
            <li>Right to withdraw consent</li>
          </ul>
          <p>
            To exercise these rights, please contact us using the information provided in Section 15.
          </p>
        </div>
      ),
    },
    {
      title: "14. Changes to This Privacy Policy",
      content: (
        <div className="space-y-3">
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
          </p>
          <p>
            We may also notify you of changes via email or through our Service. We encourage you to review this Privacy Policy periodically for any changes.
          </p>
        </div>
      ),
    },
    {
      title: "15. Contact Us",
      content: (
        <div className="space-y-3">
          <p>
            If you have any questions about this Privacy Policy or our privacy practices, please contact us:
          </p>
          <ul className="list-none space-y-2 ml-4">
            <li>
              <strong>Email:</strong> privacy@slabmarket.com
            </li>
            <li>
              <strong>Support:</strong> support@slabmarket.com
            </li>
            <li>
              <strong>Data Protection Officer:</strong> dpo@slabmarket.com
            </li>
          </ul>
          <p>
            You can also update your privacy preferences or exercise your rights by logging into your account and visiting the Privacy Settings page.
          </p>
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
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100">
              Privacy Policy
            </h1>
          </div>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Introduction */}
        <Card className="mb-8 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border-purple-200 dark:border-purple-800">
          <CardContent className="p-6">
            <p className="text-slate-700 dark:text-slate-300 mb-3">
              We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, and protect your information when you use Slab Market.
            </p>
            <div className="flex items-start gap-3 mt-4 pt-4 border-t border-purple-200 dark:border-purple-800">
              <Lock className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">Your Privacy Matters</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  We never sell your personal information. We only share it as described in this policy.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Sections */}
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

        {/* Key Points */}
        <div className="grid md:grid-cols-3 gap-4 mt-8 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6 text-center">
              <Lock className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
              <h3 className="font-semibold mb-2 text-slate-900 dark:text-slate-100">Secure Storage</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                All data is encrypted and stored securely
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800">
            <CardContent className="p-6 text-center">
              <Eye className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-3" />
              <h3 className="font-semibold mb-2 text-slate-900 dark:text-slate-100">Transparent</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Clear information about data usage
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200 dark:border-purple-800">
            <CardContent className="p-6 text-center">
              <User className="h-8 w-8 text-purple-600 dark:text-purple-400 mx-auto mb-3" />
              <h3 className="font-semibold mb-2 text-slate-900 dark:text-slate-100">Your Control</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Manage your privacy settings anytime
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Contact */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">
              Questions About Privacy?
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              If you have any questions or concerns about our Privacy Policy, please don't hesitate to contact us.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild>
                <Link href="/contact">
                  Contact Us
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/profile">
                  Privacy Settings
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

