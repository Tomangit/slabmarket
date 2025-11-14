
import { Button } from "@/components/ui/button";
import { Award } from "lucide-react";
import Link from "next/link";

export function MarketplaceHeader() {
  return (
    <header className="border-b bg-white dark:bg-slate-900 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Award className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Slab Market
            </span>
          </Link>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/marketplace" className="text-sm font-medium hover:text-blue-600 transition-colors">
              Marketplace
            </Link>
            <Link href="/about" className="text-sm font-medium hover:text-blue-600 transition-colors">
              How It Works
            </Link>
            <Link href="/pricing" className="text-sm font-medium hover:text-blue-600 transition-colors">
              Pricing
            </Link>
            <Button variant="outline" size="sm">Sign In</Button>
            <Button size="sm">Sell</Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
