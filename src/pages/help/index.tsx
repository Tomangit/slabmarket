import { useTranslations } from "next-intl";
import { MainHeader } from "@/components/MainHeader";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  HelpCircle, 
  ShoppingCart, 
  Store, 
  Shield, 
  FileText, 
  MessageSquare,
  ArrowRight,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";

export default function HelpPage() {
  const t = useTranslations();

  const helpCategories = [
    {
      title: "For Buyers",
      description: "Learn how to buy safely and use buyer protection",
      icon: ShoppingCart,
      link: "/help/buying",
      color: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "For Sellers",
      description: "How to list a slab, manage listings and sell effectively",
      icon: Store,
      link: "/help/selling",
      color: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800",
      iconColor: "text-green-600 dark:text-green-400",
    },
    {
      title: "Protection & Safety",
      description: "How buyer protection, certificate verification and dispute resolution work",
      icon: Shield,
      link: "/help/safety",
      color: "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
    {
      title: "FAQ",
      description: "Frequently asked questions and answers",
      icon: HelpCircle,
      link: "/help/faq",
      color: "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800",
      iconColor: "text-orange-600 dark:text-orange-400",
    },
  ];

  const quickLinks = [
    { title: "How to buy?", link: "/help/buying#how-to-buy" },
    { title: "How to list a slab?", link: "/help/selling#how-to-list" },
    { title: "Buyer Protection", link: "/verification" },
    { title: "Certificate Verification", link: "/verification" },
    { title: "Dispute Resolution", link: "/support/disputes" },
    { title: "Contact Support", link: "/contact" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <MainHeader />
      
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
            <HelpCircle className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold mb-4 text-slate-900 dark:text-slate-100">
            Help Center
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Find answers to your questions and learn how to use Slab Market
          </p>
        </div>

        {/* Help Categories */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {helpCategories.map((category) => {
            const Icon = category.icon;
            return (
              <Card 
                key={category.link}
                className={`${category.color} hover:shadow-lg transition-shadow cursor-pointer`}
              >
                <Link href={category.link}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-white dark:bg-slate-800 ${category.iconColor}`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">{category.title}</CardTitle>
                          <CardDescription className="mt-1">
                            {category.description}
                          </CardDescription>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-slate-400" />
                    </div>
                  </CardHeader>
                </Link>
              </Card>
            );
          })}
        </div>

        {/* Quick Links */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Quick Links
            </CardTitle>
            <CardDescription>
              Most searched topics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {quickLinks.map((link) => (
                <Link
                  key={link.link}
                  href={link.link}
                  className="flex items-center gap-2 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                >
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {link.title}
                  </span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Contact Support */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Need Additional Help?
            </CardTitle>
            <CardDescription>
              Didn't find what you're looking for? Contact our support team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild>
                <Link href="/contact">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Contact Us
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/support/disputes">
                  <Shield className="mr-2 h-4 w-4" />
                  Report an Issue
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

