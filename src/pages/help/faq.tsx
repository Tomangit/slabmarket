import { useTranslations } from "next-intl";
import { MainHeader } from "@/components/MainHeader";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  HelpCircle, 
  ChevronDown,
  ChevronUp,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

interface FAQItem {
  question: string;
  answer: string;
  category: "buying" | "selling" | "safety" | "general";
}

const faqData: FAQItem[] = [
  // General
  {
    question: "What is Slab Market?",
    answer: "Slab Market is a platform for trading verified, graded collectible cards (slabs). We enable secure trading with full buyer protection and certificate verification.",
    category: "general",
  },
  {
    question: "What card categories are available?",
    answer: "Currently we offer Pokemon TCG cards. We plan to expand to other categories such as Lorcana, Sport Cards, and Magic: The Gathering.",
    category: "general",
  },
  {
    question: "Can I sell without registering a company?",
    answer: "Yes, you can start selling as an individual. However, for larger transactions and full integration with payment systems, company registration may be required.",
    category: "general",
  },
  // Buying
  {
    question: "How does buyer protection work?",
    answer: "Buyer protection ensures that you receive exactly what you ordered, or a refund. All transactions are protected by our escrow system, which holds payment until you confirm receipt and verification of the product.",
    category: "buying",
  },
  {
    question: "How can I verify certificate authenticity?",
    answer: "You can verify the certificate directly on the grading company's website (PSA, BGS, CGC) using the certificate number. On our /verification page you'll find a detailed guide on how to spot fake slabs.",
    category: "buying",
  },
  {
    question: "How long does shipping take?",
    answer: "Shipping time depends on the seller and chosen shipping method. Most sellers offer shipping within 1-3 business days. Details can be found in each listing's description.",
    category: "buying",
  },
  {
    question: "Can I return a product?",
    answer: "Yes, if the product doesn't match the description or is damaged, you can request a return within 7 days of receipt. All returns are reviewed by our support team.",
    category: "buying",
  },
  // Selling
  {
    question: "How do I list a slab for sale?",
    answer: "Go to the 'Sell' section in the menu, fill out the form with card information (certificate, grade, photos) and set a price. After verification, your listing will appear in the marketplace.",
    category: "selling",
  },
  {
    question: "What fees are charged to sellers?",
    answer: "We charge a commission on each completed transaction. Exact rates can be found on the /pricing page. There are no fees for listing items.",
    category: "selling",
  },
  {
    question: "Can I bulk import listings from CSV?",
    answer: "Yes! In the seller dashboard (Dashboard → Bulk Tools) you can import multiple listings at once using a CSV file. You can also export all your listings.",
    category: "selling",
  },
  {
    question: "How can I update prices for multiple listings at once?",
    answer: "In the Bulk Tools section you can update prices for all listings using a CSV file or apply a rule (e.g., increase all prices by 10%).",
    category: "selling",
  },
  {
    question: "When will I receive payment?",
    answer: "Payment is processed after the buyer confirms receipt of the product. This usually takes 2-5 business days after delivery.",
    category: "selling",
  },
  // Safety
  {
    question: "How does certificate verification work?",
    answer: "All certificates are automatically verified by our system. We check the certificate number in the grading companies' databases. You can also verify certificates manually on the grading company's website.",
    category: "safety",
  },
  {
    question: "What should I do if I received a fake slab?",
    answer: "Report it immediately through the 'Report an Issue' or 'Disputes' section. Our team will investigate and ensure a full refund as well as appropriate consequences for the seller.",
    category: "safety",
  },
  {
    question: "How does the escrow system work?",
    answer: "Payment is held in a secure escrow system until the buyer confirms receipt and verification of the product. This ensures security for both parties in the transaction.",
    category: "safety",
  },
  {
    question: "Is my data secure?",
    answer: "Yes, we use the highest security standards. All data is encrypted and payments are processed by trusted providers. We never share your personal data with third parties.",
    category: "safety",
  },
];

const categories = [
  { id: "all", label: "All" },
  { id: "general", label: "General" },
  { id: "buying", label: "Buying" },
  { id: "selling", label: "Selling" },
  { id: "safety", label: "Safety" },
];

export default function FAQPage() {
  const t = useTranslations();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredFAQs = selectedCategory === "all" 
    ? faqData 
    : faqData.filter(faq => faq.category === selectedCategory);

  const toggleItem = (index: number) => {
    const newOpen = new Set(openItems);
    if (newOpen.has(index)) {
      newOpen.delete(index);
    } else {
      newOpen.add(index);
    }
    setOpenItems(newOpen);
  };

  // Prevent hydration mismatch - only render interactive content after mount
  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <MainHeader />
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="mb-8">
            <Button variant="ghost" asChild className="mb-4">
              <Link href="/help">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Help Center
              </Link>
            </Button>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <HelpCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100">
                Frequently Asked Questions (FAQ)
              </h1>
            </div>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Find answers to the most common questions about Slab Market
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

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
            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
              <HelpCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100">
              Frequently Asked Questions (FAQ)
            </h1>
          </div>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Find answers to the most common questions about Slab Market
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.label}
            </Button>
          ))}
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {filteredFAQs.map((faq, index) => {
            const isOpen = openItems.has(index);
            return (
              <Card key={index} className="overflow-hidden">
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full text-left"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex-1">
                        {faq.question}
                      </h3>
                      {isOpen ? (
                        <ChevronUp className="h-5 w-5 text-slate-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-slate-400 flex-shrink-0" />
                      )}
                    </div>
                    {isOpen && (
                      <p className="mt-4 text-slate-600 dark:text-slate-400 leading-relaxed">
                        {faq.answer}
                      </p>
                    )}
                  </CardContent>
                </button>
              </Card>
            );
          })}
        </div>

        {/* Still have questions */}
        <Card className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6 text-center">
            <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">
              Still have questions?
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Contact our support team
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild>
                <Link href="/contact">Contact Us</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/help">More Help</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}

