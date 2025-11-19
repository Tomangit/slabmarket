
import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-slate-50 dark:bg-slate-900 py-12 mt-20">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <Image
                src="/logosm6.png?v=2"
                alt="SLab Market logo"
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
              />
              <span className="text-lg font-bold">Slab Market</span>
            </Link>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              The premium marketplace for authenticated graded collectibles.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Marketplace</h3>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <Link href="/marketplace" className="hover:text-blue-600 transition-colors">
                  Browse Slabs
                </Link>
              </li>
              <li>
                <Link href="/sell" className="hover:text-blue-600 transition-colors">
                  Start Selling
                </Link>
              </li>
              <li>
                <Link href="/marketplace?featured=true" className="hover:text-blue-600 transition-colors">
                  Featured Listings
                </Link>
              </li>
              <li>
                <Link href="/marketplace?sort=recent" className="hover:text-blue-600 transition-colors">
                  New Arrivals
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <Link href="/help" className="hover:text-blue-600 transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/help/faq" className="hover:text-blue-600 transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/verification" className="hover:text-blue-600 transition-colors">
                  Buyer Protection
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-blue-600 transition-colors">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <Link href="/about" className="hover:text-blue-600 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-blue-600 transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-blue-600 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-blue-600 transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t pt-8 text-center text-sm text-slate-600 dark:text-slate-400">
          <p>© 2025 Slab Market. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
