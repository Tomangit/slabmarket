import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { useTranslations } from 'next-intl';
import { useRouter } from "next/router";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { MainHeader } from "@/components/MainHeader";
import { Footer } from "@/components/Footer";
import { Filter, Search, Users, ShoppingCart, Grid3X3, List, Image as ImageIcon, Sparkles, TrendingUp, Star, Package, Eye, Camera } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PriceDisplay } from "@/components/PriceDisplay";
import { cardService, type MarketplaceCard } from "@/services/cardService";
import { slabService } from "@/services/slabService";
import { useCart } from "@/contexts/CartContext";
import { setService } from "@/services/setService";
import type { PokemonSet } from "@/data/pokemonSetCatalog";
import { SetCombobox } from "@/components/SetCombobox";
import { AddCardToWishlistButton } from "@/components/AddCardToWishlistButton";
import { useAuth } from "@/contexts/AuthContext";
import { wishlistService } from "@/services/wishlistService";
import { SEO } from "@/components/SEO";

type ViewMode = "grid" | "list";
type SortOption = 
  | "popular" 
  | "price-low" 
  | "price-high" 
  | "name-asc" 
  | "name-desc" 
  | "number-low" 
  | "number-high" 
  | "rarity-low" 
  | "rarity-high" 
  | "date-old" 
  | "date-new";

export default function MarketplacePage() {
  const t = useTranslations();
  const router = useRouter();
  const { user } = useAuth();
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [cards, setCards] = useState<MarketplaceCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSetSlug, setSelectedSetSlug] = useState("all");
  const [sets, setSets] = useState<PokemonSet[]>([]);
  const [setsLoading, setSetsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [selectedEditionVariants, setSelectedEditionVariants] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("popular");
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [hoveredCardImage, setHoveredCardImage] = useState<string | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);
  const [showWishlistOnly, setShowWishlistOnly] = useState(false);
  const [wishlistSlabIds, setWishlistSlabIds] = useState<string[]>([]);
  const [featuredSlabs, setFeaturedSlabs] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("pokemon-tcg");
  const [lorcanaSetNames, setLorcanaSetNames] = useState<string[]>([]);
  const [selectedRarity, setSelectedRarity] = useState<string>("all");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCards, setTotalCards] = useState(0);
  const pageSize = 100;

  useEffect(() => {
    let isMounted = true;
    setSetsLoading(true);
    setService
      .getAllSets()
      .then((data) => {
        if (isMounted) {
          setSets(data);
          
          // Check for set parameter in URL
          const setParam = router.query.set as string | undefined;
          if (setParam && setParam !== "all") {
            // Verify the set exists
            const setExists = data.find((s) => s.slug === setParam);
            if (setExists) {
              setSelectedSetSlug(setParam);
            }
          }
        }
      })
      .catch(() => {
        // fallback already handled inside service, but ensure we don't leave spinner running on error
      })
      .finally(() => {
        if (isMounted) {
          setSetsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [router.query.set]);

  // Handle deep-link for Lorcana via ?set_name= (always switch category to Lorcana)
  useEffect(() => {
    const setNameParam = router.query.set_name as string | undefined;
    if (setNameParam && typeof setNameParam === "string") {
      // Force category to Lorcana and apply set_name directly
      setSelectedCategoryId("disney-lorcana");
      try {
        const decoded = decodeURIComponent(setNameParam);
        setSelectedSetSlug(decoded);
      } catch {
        setSelectedSetSlug(setNameParam);
      }
    }
  }, [router.query.set_name]);
  // Handle deep-link for category (?category or ?category_id)
  useEffect(() => {
    const cat = (router.query.category as string) || (router.query.category_id as string);
    if (cat && (cat === "pokemon-tcg" || cat === "disney-lorcana")) {
      setSelectedCategoryId(cat);
    }
  }, [router.query.category, router.query.category_id]);
  // Load wishlist slab IDs when user is logged in and showWishlistOnly is true
  useEffect(() => {
    if (user && showWishlistOnly) {
      const loadWishlistSlabIds = async () => {
        try {
          const slabIds = await wishlistService.getAllSlabsInWishlists(user.id);
          setWishlistSlabIds(slabIds);
        } catch (error) {
          console.error("Error loading wishlist slab IDs:", error);
          setWishlistSlabIds([]);
        }
      };
      loadWishlistSlabIds();
    } else {
      setWishlistSlabIds([]);
    }
  }, [user, showWishlistOnly]);

  // Load featured slabs for the top strip
  useEffect(() => {
    slabService.getFeatured(6)
      .then(setFeaturedSlabs)
      .catch(() => setFeaturedSlabs([]));
  }, []);

  // Load Lorcana set names dynamically via cardService (RLS-safe)
  useEffect(() => {
    if (selectedCategoryId !== "disney-lorcana") return;
    (async () => {
      try {
        const knownSets = [
          "The First Chapter",
          "Rise of the Floodborn",
          "Into the Inklands",
          "Ursula's Return",
          "Shimmering Skies",
          "Reign of Jafar",
          "Whispers in the Well",
          "Archazia's Island",
          "Azurite Sea",
          "Fabled",
          // Promos (ensure always present)
          "Promo Set 1",
          "Promo Set 2",
          "Challenge Promo",
          "D23 Collection",
        ];
        const dbNames = await cardService.getSetNames("disney-lorcana");
        const merged = Array.from(new Set([...(dbNames || []), ...knownSets]));
        // Sort with knownSets order first, then alphabetical
        const order = new Map(knownSets.map((n, i) => [n, i]));
        merged.sort((a, b) => {
          const ia = order.has(a) ? order.get(a)! : 999;
          const ib = order.has(b) ? order.get(b)! : 999;
          if (ia !== ib) return ia - ib;
          return a.localeCompare(b);
        });
        setLorcanaSetNames(merged);
      } catch (e: any) {
        console.error("Error loading Lorcana sets:", e?.message || e);
        setLorcanaSetNames([
          "The First Chapter",
          "Rise of the Floodborn",
          "Into the Inklands",
          "Ursula's Return",
          "Shimmering Skies",
          "Reign of Jafar",
          "Whispers in the Well",
          "Archazia's Island",
          "Azurite Sea",
          "Fabled",
        ]);
      }
    })();
  }, [selectedCategoryId]);
  const loadCards = useCallback(async () => {
    try {
      setLoading(true);
      const selectedSet = selectedSetSlug === "all" ? undefined : sets.find((set) => set.slug === selectedSetSlug);
      // Determine set filter name based on category:
      // - Pokemon uses canonical set.name from catalog/DB
      // - Lorcana uses raw set_name stored on cards (string)
      let setNameFilter: string | undefined = undefined;
      if (selectedCategoryId === "pokemon-tcg") {
        setNameFilter = selectedSet?.name;
      } else if (selectedCategoryId === "disney-lorcana" && selectedSetSlug !== "all") {
        setNameFilter = selectedSetSlug;
      }
      
      let result;
      if (showWishlistOnly && user) {
        // Load cards from wishlists
        result = await cardService.getCardsInWishlists(user.id, {
          category_id: selectedCategoryId || undefined,
          set_name: setNameFilter,
          rarity: selectedRarity !== "all" ? selectedRarity : undefined,
          min_price: priceRange[0],
          max_price: priceRange[1],
          search: searchQuery || undefined,
          page: currentPage,
          pageSize,
          sortBy,
        });
      } else {
        // Load all cards
        // Use marketplace_cards view to get price information for sorting
        result = await cardService.getAllMarketplaceCards({
          category_id: selectedCategoryId || undefined,
          set_name: setNameFilter,
          illustrator: (router.query.illustrator as string) || undefined,
          force_cards: false, // Always use marketplace_cards view to get price data for sorting
          rarity: selectedRarity !== "all" ? selectedRarity : undefined,
          min_price: priceRange[0],
          max_price: priceRange[1],
          search: searchQuery || undefined,
          page: currentPage,
          pageSize,
          sortBy,
        });
      }
      
      setCards(result.cards);
      setTotalCards(result.total);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error("Error loading cards:", error);
      // Set empty state on error
      setCards([]);
      setTotalCards(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, selectedSetSlug, priceRange, sortBy, sets, pageSize, showWishlistOnly, user, selectedCategoryId, selectedRarity]);

  // Load cards when filters, search, sort, or page changes
  useEffect(() => {
    loadCards();
  }, [loadCards]);

  // Reset to page 1 when filters change (but not on initial load)
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedSetSlug, priceRange, sortBy, showWishlistOnly, selectedCategoryId, selectedRarity]);

  const marketplaceDescription = `Browse ${totalCards} graded trading cards from ${sets.length} sets. Find PSA, BGS, and CGC certified Pokemon cards. Filter by price, grade, set, and more.`;
  const searchKeywords = searchQuery ? [searchQuery, "graded cards", "trading cards", "Pokemon cards"] : ["graded cards", "trading cards", "Pokemon cards", "PSA", "BGS", "CGC", "slab market"];

  return (
    <>
      <SEO
        title={`Marketplace${searchQuery ? ` - ${searchQuery}` : ""} - Browse Graded Trading Cards`}
        description={marketplaceDescription}
        keywords={searchKeywords}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Trading Cards Marketplace",
          description: marketplaceDescription,
          url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://slabmarket.com"}/marketplace`,
        }}
      />
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
        <MainHeader currentPage="marketplace" />

      <div className="container mx-auto px-4 py-8 flex-1">
        {/* Featured strip */}
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-600" />
                <h2 className="text-xl font-semibold tracking-tight">Featured Listings</h2>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/marketplace">{t('common.view')} All</Link>
              </Button>
            </div>
            {featuredSlabs.length > 0 ? (
              <div className="overflow-x-auto">
                <div className="flex gap-4 min-w-full">
                  {featuredSlabs.map((slab) => (
                    <Card key={slab.id} className="min-w-[300px] flex-shrink-0">
                      <CardHeader className="p-0">
                        <Link href={`/slab/${slab.id}`} className="block relative aspect-[3/4] bg-slate-200 dark:bg-slate-800 rounded-t-lg overflow-hidden">
                          {slab.images && slab.images.length > 0 ? (
                            <Image src={slab.images[0]} alt={slab.name || "Slab"} fill className="object-cover" />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-5xl">🧩</div>
                          )}
                        </Link>
                      </CardHeader>
                      <CardContent className="p-3">
                        <Link href={`/slab/${slab.id}`} className="font-medium line-clamp-1">
                          {slab.name || "Featured slab"}
                        </Link>
                        {slab.price && (
                          <p className="text-blue-600 font-semibold">
                            <PriceDisplay price={slab.price} fromCurrency="USD" />
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-sm text-slate-600 dark:text-slate-400">
                  No featured listings yet. Be the first to create one!
                </CardContent>
              </Card>
            )}
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <Input
                type="search"
                placeholder={t('marketplace.searchPlaceholder')}
                className="pl-10 h-12"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="lg" className="md:hidden">
                  <Filter className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>{t('marketplace.filters')}</SheetTitle>
                  <SheetDescription>
                    {t('marketplace.refineSearch')}
                  </SheetDescription>
                </SheetHeader>
                <FilterPanel 
                  priceRange={priceRange} 
                  setPriceRange={setPriceRange}
                  sets={sets}
                  setsLoading={setsLoading}
                  selectedCategoryId={selectedCategoryId}
                  setSelectedCategoryId={setSelectedCategoryId}
                  selectedSetSlug={selectedSetSlug}
                  setSelectedSetSlug={setSelectedSetSlug}
                  selectedGrades={selectedGrades}
                  setSelectedGrades={setSelectedGrades}
                  selectedEditionVariants={selectedEditionVariants}
                  setSelectedEditionVariants={setSelectedEditionVariants}
                  showWishlistOnly={showWishlistOnly}
                  setShowWishlistOnly={setShowWishlistOnly}
                  lorcanaSetNames={lorcanaSetNames}
                  selectedRarity={selectedRarity}
                  setSelectedRarity={setSelectedRarity}
                />
              </SheetContent>
            </Sheet>
            <Button size="lg" onClick={() => {
              setCurrentPage(1);
              loadCards();
            }}>
              <Search className="h-5 w-5 mr-2" />
              Search
            </Button>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Desktop Filters Sidebar */}
          <aside className="hidden md:block w-80 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FilterPanel 
                  priceRange={priceRange} 
                  setPriceRange={setPriceRange}
                  sets={sets}
                  setsLoading={setsLoading}
                  selectedCategoryId={selectedCategoryId}
                  setSelectedCategoryId={setSelectedCategoryId}
                  selectedSetSlug={selectedSetSlug}
                  setSelectedSetSlug={setSelectedSetSlug}
                  selectedGrades={selectedGrades}
                  setSelectedGrades={setSelectedGrades}
                  selectedEditionVariants={selectedEditionVariants}
                  setSelectedEditionVariants={setSelectedEditionVariants}
                  showWishlistOnly={showWishlistOnly}
                  setShowWishlistOnly={setShowWishlistOnly}
                  lorcanaSetNames={lorcanaSetNames}
                  selectedRarity={selectedRarity}
                  setSelectedRarity={setSelectedRarity}
                />
              </CardContent>
            </Card>
          </aside>

          {/* Results */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold mb-1">{t('marketplace.title')}</h1>
                <p className="text-slate-600 dark:text-slate-400">
                  {totalCards} {t('marketplace.subtitle')} • Page {currentPage} of {totalPages}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* View Toggle */}
                <div className="flex items-center gap-1 border rounded-lg p-1">
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="gap-1"
                  >
                    <List className="h-4 w-4" />
                    <span className="hidden sm:inline">List</span>
                  </Button>
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="gap-1"
                  >
                    <Grid3X3 className="h-4 w-4" />
                    <span className="hidden sm:inline">Grid</span>
                  </Button>
                </div>
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popular">{t('marketplace.mostPopular')}</SelectItem>
                    <SelectItem value="price-low">{t('marketplace.priceCheapest')}</SelectItem>
                    <SelectItem value="price-high">{t('marketplace.priceExpensive')}</SelectItem>
                    <SelectItem value="name-asc">{t('marketplace.nameAZ')}</SelectItem>
                    <SelectItem value="name-desc">{t('marketplace.nameZA')}</SelectItem>
                    <SelectItem value="number-low">{t('marketplace.numberLowest')}</SelectItem>
                    <SelectItem value="number-high">{t('marketplace.numberHighest')}</SelectItem>
                    <SelectItem value="rarity-low">{t('marketplace.rarityLowest')}</SelectItem>
                    <SelectItem value="rarity-high">{t('marketplace.rarityHighest')}</SelectItem>
                    <SelectItem value="date-old">{t('marketplace.dateOldest')}</SelectItem>
                    <SelectItem value="date-new">{t('marketplace.dateNewest')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="text-center py-12">
                <p className="text-slate-600 dark:text-slate-400">{t('common.loading')}</p>
              </div>
            ) : cards.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-lg text-slate-600 dark:text-slate-400 mb-4">
                    {t('marketplace.noCardsFound')}
                  </p>
                  <Button onClick={loadCards}>{t('marketplace.resetFilters')}</Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* List View */}
                {viewMode === "list" && (
                  <div className="relative space-y-1.5">
                    {cards.map((card, index) => (
                      <Card 
                        key={card.id} 
                        className="group overflow-hidden border hover:border-blue-500/50 dark:hover:border-blue-400/50 transition-all duration-300 hover:shadow-md hover:shadow-blue-500/10 dark:hover:shadow-blue-400/10 cursor-pointer animate-fade-in-up"
                        onClick={() => window.location.href = `/card/${card.slug || card.id}`}
                        style={{ animationDelay: `${index * 30}ms` }}
                        onMouseEnter={(e) => {
                          if (card.image_url) {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const viewportWidth = window.innerWidth;
                            const previewWidth = 380; // 350px image + padding
                            const offsetX = 20;
                            
                            // Check if preview would go off screen to the right
                            let x = rect.left + rect.width + offsetX;
                            if (x + previewWidth > viewportWidth) {
                              // Position to the left of the card instead
                              x = rect.left - previewWidth - offsetX;
                            }
                            
                            setHoveredCardId(card.id);
                            setHoveredCardImage(card.image_url);
                            setHoverPosition({
                              x: Math.max(10, x), // Ensure it doesn't go off left edge
                              y: rect.top
                            });
                          }
                        }}
                        onMouseLeave={() => {
                          setHoveredCardId(null);
                          setHoveredCardImage(null);
                          setHoverPosition(null);
                        }}
                        onMouseMove={(e) => {
                          if (card.image_url && hoveredCardId === card.id) {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const viewportWidth = window.innerWidth;
                            const previewWidth = 380;
                            const offsetX = 20;
                            
                            let x = rect.left + rect.width + offsetX;
                            if (x + previewWidth > viewportWidth) {
                              x = rect.left - previewWidth - offsetX;
                            }
                            
                            setHoverPosition({
                              x: Math.max(10, x),
                              y: rect.top
                            });
                          }
                        }}
                      >
                        <div className="flex items-center gap-2 p-2 h-16">
                          {/* Card Image - Always shows camera icon */}
                          <div className="relative flex-shrink-0">
                            <div className="relative h-10 w-8 bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-900 rounded overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                              <Camera className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                            </div>
                            {card.total_listings > 0 && (
                              <div className="absolute -top-0.5 -right-0.5 bg-green-500 text-white text-[9px] font-bold rounded-full h-3.5 w-3.5 flex items-center justify-center shadow-md z-10">
                                {card.total_listings}
                              </div>
                            )}
                          </div>

                          {/* Card Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <Link 
                                  href={`/card/${card.slug || card.id}`}
                                  className="block"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                                    {card.name}
                                  </h3>
                                </Link>
                                <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                  {card.card_number && (
                                    <div className="flex items-center gap-0.5 text-[10px] text-slate-600 dark:text-slate-400">
                                      <Package className="h-2.5 w-2.5" />
                                      <span className="font-medium">#{card.card_number}</span>
                                    </div>
                                  )}
                                  <Badge 
                                    variant="outline" 
                                    className="text-[9px] font-semibold border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/30 px-1 py-0 h-4"
                                  >
                                    {getSeriesCode(card)}
                                  </Badge>
                                  {card.rarity && (
                                    <div className="flex items-center gap-0.5">
                                      {getRarityIcon(card.rarity)}
                                      <span className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">
                                        {card.rarity}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Price & Availability */}
                              <div className="flex items-center gap-3 flex-shrink-0">
                                {card.lowest_price ? (
                                  <div className="flex items-center gap-1.5 text-right">
                                    <div className="flex items-center gap-0.5">
                                      <TrendingUp className="h-2.5 w-2.5 text-green-600 dark:text-green-400" />
                                      <span className="text-[9px] text-slate-500 dark:text-slate-400">{t('marketplace.from')}</span>
                                    </div>
                                    <p className="text-sm font-bold text-green-600 dark:text-green-400 leading-tight">
                                      <PriceDisplay price={card.lowest_price} fromCurrency="USD" />
                                    </p>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-0.5">
                                    <Eye className="h-2.5 w-2.5 text-slate-400" />
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                      {t('marketplace.noListings')}
                                    </span>
                                  </div>
                                )}

                                {/* Action Button */}
                                <div onClick={(e) => e.stopPropagation()}>
                                  <AddToCartButton 
                                    card={card} 
                                    variant={card.lowest_price ? "default" : "outline"}
                                    className="min-w-[90px] shadow-sm hover:shadow-md transition-shadow text-[10px] h-7 px-2"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                    
                    {/* Large Card Image Preview on Hover */}
                    {hoveredCardId && hoveredCardImage && hoverPosition && (
                      <div
                        className="fixed z-50 pointer-events-none transition-opacity duration-200 animate-in fade-in-0"
                        style={{
                          left: `${hoverPosition.x}px`,
                          top: `${hoverPosition.y}px`,
                          transform: 'translateY(0)'
                        }}
                      >
                        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl border-2 border-slate-200 dark:border-slate-700 p-3">
                          <img
                            src={hoveredCardImage}
                            alt="Card preview"
                            className="w-[350px] h-auto object-contain rounded"
                            style={{ maxHeight: '500px' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Grid View */}
                {viewMode === "grid" && (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {cards.map((card) => (
                      <CardListingCard key={card.id} card={card} />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage > 1) {
                            setCurrentPage(currentPage - 1);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }
                        }}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    
                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(pageNum);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            isActive={currentPage === pageNum}
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    
                    {totalPages > 5 && currentPage < totalPages - 2 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    
                    {totalPages > 5 && currentPage < totalPages - 2 && (
                      <PaginationItem>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(totalPages);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                        >
                          {totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    )}
                    
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage < totalPages) {
                            setCurrentPage(currentPage + 1);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }
                        }}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
      </div>
    </>
  );
}

function FilterPanel({
  priceRange,
  setPriceRange,
  sets,
  setsLoading,
  selectedCategoryId,
  setSelectedCategoryId,
  selectedSetSlug,
  setSelectedSetSlug,
  selectedGrades,
  setSelectedGrades,
  selectedEditionVariants,
  setSelectedEditionVariants,
  showWishlistOnly,
  setShowWishlistOnly,
  lorcanaSetNames,
  selectedRarity,
  setSelectedRarity,
}: {
  priceRange: number[];
  setPriceRange: (value: number[]) => void;
  sets: PokemonSet[];
  setsLoading: boolean;
  selectedCategoryId: string;
  setSelectedCategoryId: (value: string) => void;
  selectedSetSlug: string;
  setSelectedSetSlug: (value: string) => void;
  selectedGrades: string[];
  setSelectedGrades: React.Dispatch<React.SetStateAction<string[]>>;
  selectedEditionVariants: string[];
  setSelectedEditionVariants: React.Dispatch<React.SetStateAction<string[]>>;
  showWishlistOnly?: boolean;
  setShowWishlistOnly?: (value: boolean) => void;
  lorcanaSetNames?: string[];
  selectedRarity: string;
  setSelectedRarity: (value: string) => void;
}) {
  const t = useTranslations();
  const { user } = useAuth();
  const KNOWN_LORCANA_SETS = [
    "The First Chapter",
    "Rise of the Floodborn",
    "Into the Inklands",
    "Ursula's Return",
    "Shimmering Skies",
    "Reign of Jafar",
    "Whispers in the Well",
    "Archazia's Island",
    "Azurite Sea",
    "Fabled",
  ];
  const grades = ["10", "9", "8", "7", "6", "5", "4", "3", "2", "1"];
  const editionVariants =
    selectedCategoryId === "pokemon-tcg"
      ? [
    { key: "first_edition", label: "First Edition" },
    { key: "shadowless", label: "Shadowless" },
    { key: "pokemon_center_edition", label: "Pokemon Center Edition" },
    { key: "prerelease", label: "Prerelease" },
    { key: "staff", label: "Staff" },
    { key: "tournament_card", label: "Tournament Card" },
    { key: "error_card", label: "Error Card" },
        ]
      : [
          // Lorcana: dopasuj do możliwości ze strony karty (bez First Edition/Shadowless/PC Edition)
          { key: "holo", label: "Holo" },
          { key: "reverse_holo", label: "Reverse Holo" },
          { key: "foil", label: "Foil" },
          { key: "prerelease", label: "Prerelease" },
          { key: "staff", label: "Staff" },
          { key: "tournament_card", label: "Tournament Card" },
          { key: "error_card", label: "Error Card" },
  ];

  const toggleGrade = (grade: string) => {
    setSelectedGrades(prev => 
      prev.includes(grade) 
        ? prev.filter(g => g !== grade)
        : [...prev, grade]
    );
  };

  const toggleEditionVariant = (variant: string) => {
    setSelectedEditionVariants(prev => 
      prev.includes(variant) 
        ? prev.filter(v => v !== variant)
        : [...prev, variant]
    );
  };

  return (
    <div className="space-y-6">
      {user && setShowWishlistOnly && (
        <div>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showWishlistOnly || false}
              onChange={(e) => setShowWishlistOnly(e.target.checked)}
              className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium">Show only cards in my wishlists</span>
          </label>
          <p className="text-xs text-slate-500 mt-1">
            Filter to show only cards that are in your wishlists
          </p>
        </div>
      )}

      <div>
        <label className="text-sm font-medium mb-2 block">{t('marketplace.category')}</label>
        <Select value={selectedCategoryId} onValueChange={(v) => {
          setSelectedCategoryId(v);
          // reset set filter when switching away from pokemon
          if (v !== "pokemon-tcg") setSelectedSetSlug("all");
        }}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pokemon-tcg">Pokemon TCG</SelectItem>
            <SelectItem value="disney-lorcana">Disney Lorcana</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selectedCategoryId === "pokemon-tcg" && (
      <div>
        <label className="text-sm font-medium mb-2 block">{t('marketplace.setEdition')}</label>
        <SetCombobox
          sets={sets}
          value={selectedSetSlug}
          onChange={setSelectedSetSlug}
          isLoading={setsLoading}
        />
      </div>
      )}
      {selectedCategoryId === "disney-lorcana" && (
        <div>
          <label className="text-sm font-medium mb-2 block">Set</label>
          <Select value={selectedSetSlug} onValueChange={setSelectedSetSlug}>
            <SelectTrigger>
              <SelectValue placeholder="All sets" />
            </SelectTrigger>
            <SelectContent className="max-h-60 overflow-auto" position="popper">
              <SelectItem value="all">All sets</SelectItem>
              {((lorcanaSetNames && lorcanaSetNames.length > 0) ? lorcanaSetNames : KNOWN_LORCANA_SETS).map((name) => (
                <SelectItem key={name} value={name}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="mt-1 text-xs text-slate-500">
            Sets: {(lorcanaSetNames && lorcanaSetNames.length > 0) ? lorcanaSetNames.length : KNOWN_LORCANA_SETS.length}
          </p>
          <div className="mt-4">
            <label className="text-sm font-medium mb-2 block">Rarity</label>
            <Select value={selectedRarity} onValueChange={setSelectedRarity}>
              <SelectTrigger>
                <SelectValue placeholder="All rarities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All rarities</SelectItem>
                <SelectItem value="Common">Common</SelectItem>
                <SelectItem value="Uncommon">Uncommon</SelectItem>
                <SelectItem value="Rare">Rare</SelectItem>
                <SelectItem value="Super Rare">Super Rare</SelectItem>
                <SelectItem value="Legendary">Legendary</SelectItem>
                <SelectItem value="Enchanted">Enchanted</SelectItem>
                <SelectItem value="Iconic">Iconic</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <div>
        <label className="text-sm font-medium mb-4 block">
          {t('marketplace.priceRange')}: ${priceRange[0]} - ${priceRange[1]}
        </label>
        <div className="space-y-4">
          <Slider
            value={priceRange}
            onValueChange={setPriceRange}
            min={0}
            max={10000}
            step={100}
            className="mt-2"
          />
          <div className="flex gap-4 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex-1">
              <span>Min: ${priceRange[0]}</span>
            </div>
            <div className="flex-1 text-right">
              <span>Max: ${priceRange[1]}</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">{t('marketplace.gradingCompany')}</label>
        <Select defaultValue="all">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('marketplace.allCompanies')}</SelectItem>
            <SelectItem value="psa">PSA</SelectItem>
            <SelectItem value="bgs">BGS / Beckett</SelectItem>
            <SelectItem value="cgc">CGC</SelectItem>
            <SelectItem value="sgc">SGC</SelectItem>
            <SelectItem value="ace">ACE Grading</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium mb-3 block">{t('marketplace.grade')}</label>
        <div className="space-y-2">
          {grades.map((grade) => (
            <label key={grade} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedGrades.includes(grade)}
                onChange={() => toggleGrade(grade)}
                className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">{grade}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-3 block">Edition Variants</label>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {editionVariants.map((variant) => (
            <label key={variant.key} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedEditionVariants.includes(variant.key)}
                onChange={() => toggleEditionVariant(variant.key)}
                className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">{variant.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

const CardListingCard = memo(function CardListingCard({ card }: { card: MarketplaceCard }) {
  const t = useTranslations();
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div 
      className="group relative h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card className="h-full overflow-hidden transition-all duration-500 ease-out hover:shadow-2xl hover:shadow-blue-500/10 dark:hover:shadow-blue-400/10 hover:-translate-y-1">
        {/* Image Container with Overlay */}
        <CardHeader className="p-0 relative">
          <Link
            href={`/card/${card.slug || card.id}`}
            className="block relative aspect-[3/4] bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 overflow-hidden"
          >
            {card.image_url ? (
              <>
                <Image
                  src={card.image_url}
                  alt={card.name}
                  fill
                  className="object-cover transition-all duration-700 group-hover:scale-110"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  loading="lazy"
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                />
                {/* Gradient Overlay on Hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-6xl">
                🃏
              </div>
            )}
            
            {/* Grading Badges - Top Right */}
            {card.available_gradings && card.available_gradings.length > 0 && (
              <div className="absolute top-2 right-2 flex gap-1.5 flex-wrap justify-end opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                {card.available_gradings.slice(0, 2).map((grading) => (
                  <Badge 
                    key={grading} 
                    variant="secondary" 
                    className="text-[10px] py-0.5 px-1.5 backdrop-blur-sm bg-white/90 dark:bg-slate-900/90 shadow-lg"
                  >
                    {grading}
                  </Badge>
                ))}
              </div>
            )}

            {/* Quick Actions Overlay - Bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-full group-hover:translate-y-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-medium truncate mb-0.5">{card.name}</p>
                  <p className="text-white/80 text-[10px] truncate">
                    {card.set_name} {card.card_number && `• #${card.card_number}`}
                  </p>
                </div>
                {card.total_listings > 0 && (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <AddToCartButton card={card} />
                    <AddCardToWishlistButton cardId={card.id} variant="ghost" size="icon" />
                  </div>
                )}
              </div>
            </div>
          </Link>
        </CardHeader>

        {/* Content Section */}
        <CardContent className="p-4 space-y-3">
          {/* Title and Set */}
          <div className="space-y-1">
            <Link
              href={`/card/${card.slug || card.id}`}
              className="block"
            >
              <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                {card.name}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1 mt-0.5">
                {card.set_name} {card.card_number && `• #${card.card_number}`}
              </p>
            </Link>
          </div>

          {/* Series Badge */}
          <Badge variant="outline" className="uppercase text-[10px] py-0.5 px-2 font-medium">
            {getSeriesCode(card)}
          </Badge>

          {/* Price and Stats */}
          <div className="flex items-end justify-between gap-3 pt-1 border-t border-slate-200 dark:border-slate-700">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-1 font-medium uppercase tracking-wide">
                {t('marketplace.from')}
              </p>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400 leading-none">
                {card.lowest_price ? (
                  <PriceDisplay price={card.lowest_price} fromCurrency="USD" />
                ) : (
                  <span className="text-sm text-slate-400">{t('marketplace.noListings')}</span>
                )}
              </p>
            </div>
            
            {card.total_listings > 0 && (
              <div className="text-right flex-shrink-0 space-y-0.5">
                <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 justify-end">
                  <Users className="h-3 w-3" />
                  <span className="font-medium">{card.total_sellers}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 justify-end">
                  <ShoppingCart className="h-3 w-3" />
                  <span className="font-medium">{card.total_listings}</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>

        {/* Footer with CTA */}
        <CardFooter className="p-4 pt-0">
          <Button 
            className="w-full h-9 text-xs font-medium" 
            variant={card.total_listings > 0 ? "default" : "outline"}
            size="sm"
            asChild
          >
            <Link href={`/card/${card.slug || card.id}`}>
              {card.total_listings > 0 
                ? t('marketplace.viewOffers', { count: card.total_listings, plural: card.total_listings !== 1 ? 's' : '' })
                : t('marketplace.viewCardDetails')
              }
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
});

function AddToCartButton({
  card,
  variant = "default",
  className,
}: {
  card: MarketplaceCard;
  variant?: "default" | "outline" | "ghost";
  className?: string;
}) {
  const t = useTranslations();
  const { addItem } = useCart();

  const handleAdd = (event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (!card.lowest_price) {
      return;
    }

    addItem({
      id: `card-${card.id}`,
      cardId: card.id,
      name: card.name,
      price: card.lowest_price,
      imageUrl: card.image_url,
      gradingCompany: (card.available_gradings && card.available_gradings.length > 0) 
        ? card.available_gradings[0] 
        : null,
      grade: null,
      sellerName: null,
      quantity: 1,
    });
  };

  return (
    <Button
      className={cn("flex-1", className)}
      variant={variant}
      size="sm"
      disabled={!card.lowest_price}
      onClick={handleAdd}
    >
      <ShoppingCart className="h-3 w-3 mr-1" />
      {card.lowest_price ? t('common.add') : t('common.view')}
    </Button>
  );
}

function getRarityIcon(rarity: string) {
  const baseClasses = "h-2.5 w-2.5";
  switch (rarity) {
    case "Common":
      return <span className={cn(baseClasses, "text-slate-500 dark:text-slate-400 text-[10px]")}>●</span>;
    case "Uncommon":
      return <span className={cn(baseClasses, "text-blue-500 dark:text-blue-400 text-[10px]")}>◆</span>;
    case "Rare":
      return <Star className={cn(baseClasses, "text-yellow-500 dark:text-yellow-400 fill-yellow-500 dark:fill-yellow-400")} />;
    case "Ultra Rare":
      return <Sparkles className={cn(baseClasses, "text-purple-500 dark:text-purple-400")} />;
    default:
      return <span className={cn(baseClasses, "text-slate-400 text-[10px]")}>●</span>;
  }
}

function getSeriesCode(card: MarketplaceCard) {
  if (!card.name) return "—";
  
  const nameMatch = card.name.match(/\(([^)]+)\)/);
  if (nameMatch && nameMatch[1]) {
    const tokens = nameMatch[1].split(/[\s-]+/);
    const firstToken = tokens.find((token) => /[A-Za-z]/.test(token));
    if (firstToken) {
      const cleaned = firstToken.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
      if (cleaned) {
        return cleaned;
      }
    }
  }

  if (card.category_name) {
    const segments = card.category_name.match(/[A-Za-z0-9]+/g);
    if (segments && segments.length > 0) {
      const abbreviation = segments.map((segment) => segment[0]).join("").slice(0, 4).toUpperCase();
      if (abbreviation) {
        return abbreviation;
      }
    }
  }

  if (card.set_name) {
    const letters = card.set_name.match(/\b[A-Za-z0-9]/g);
    if (letters && letters.length > 0) {
      return letters.join("").slice(0, 4).toUpperCase();
    }
  }

  return "—";
}