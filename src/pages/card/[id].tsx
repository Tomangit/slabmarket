
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { MainHeader } from "@/components/MainHeader";
import { Footer } from "@/components/Footer";
import { ShieldCheck, Heart, Star, Package, User, Circle, Square, Building2, Calendar, Users, Trophy, AlertCircle } from "lucide-react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { cardService } from "@/services/cardService";
import { setService } from "@/services/setService";
import { AddCardToWishlistButton } from "@/components/AddCardToWishlistButton";
import { AddToWishlistButton } from "@/components/AddToWishlistButton";
import type { Database } from "@/integrations/supabase/types";
import { useCart } from "@/contexts/CartContext";
import { SEO } from "@/components/SEO";
import { pokemonSetReleaseYears } from "@/data/pokemonSetReleaseYears";

type Card = Database["public"]["Tables"]["cards"]["Row"];
type Slab = Database["public"]["Tables"]["slabs"]["Row"] & {
  grading_company: { id: string; name: string; code: string } | null;
  seller: { id: string; full_name: string | null; avatar_url: string | null; email: string | null } | null;
  first_edition?: boolean | null;
  shadowless?: boolean | null;
  pokemon_center_edition?: boolean | null;
  prerelease?: boolean | null;
  staff?: boolean | null;
  tournament_card?: boolean | null;
  error_card?: boolean | null;
};

// Component to display card edition icons
function CardEditionIcons({ 
  firstEdition, 
  shadowless, 
  pokemonCenterEdition, 
  prerelease, 
  staff, 
  tournamentCard, 
  errorCard 
}: {
  firstEdition?: boolean | null;
  shadowless?: boolean | null;
  pokemonCenterEdition?: boolean | null;
  prerelease?: boolean | null;
  staff?: boolean | null;
  tournamentCard?: boolean | null;
  errorCard?: boolean | null;
}) {
  const editions = [];
  
  if (firstEdition) {
    editions.push(
      <div key="first-edition" className="flex items-center gap-1" title="First Edition">
        <div className="relative h-4 w-4">
          <Circle className="h-4 w-4" />
          <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold leading-none">1</span>
        </div>
      </div>
    );
  }
  
  if (shadowless) {
    editions.push(
      <div key="shadowless" className="flex items-center gap-1" title="Shadowless">
        <Square className="h-4 w-4 stroke-[1.5]" />
      </div>
    );
  }
  
  if (pokemonCenterEdition) {
    editions.push(
      <div key="pokemon-center" className="flex items-center gap-1" title="Pokemon Center Edition">
        <Building2 className="h-4 w-4" />
      </div>
    );
  }
  
  if (prerelease) {
    editions.push(
      <div key="prerelease" className="flex items-center gap-1" title="Prerelease">
        <Calendar className="h-4 w-4" />
      </div>
    );
  }
  
  if (staff) {
    editions.push(
      <div key="staff" className="flex items-center gap-1" title="Staff">
        <Users className="h-4 w-4" />
      </div>
    );
  }
  
  if (tournamentCard) {
    editions.push(
      <div key="tournament" className="flex items-center gap-1" title="Tournament Card">
        <Trophy className="h-4 w-4" />
      </div>
    );
  }
  
  if (errorCard) {
    editions.push(
      <div key="error" className="flex items-center gap-1" title="Error Card / Misprint">
        <AlertCircle className="h-4 w-4" />
      </div>
    );
  }
  
  if (editions.length === 0) return null;
  
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {editions}
    </div>
  );
}

export default function CardDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [card, setCard] = useState<Card | null>(null);
  const [listings, setListings] = useState<Slab[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("price-low");
  const [setSlug, setSetSlug] = useState<string | null>(null);
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [availableVariants, setAvailableVariants] = useState({
    first_edition: false,
    shadowless: false,
    pokemon_center_edition: false,
    prerelease: false,
    staff: false,
    tournament_card: false,
    error_card: false,
    foil: false,
    holo: false,
    reverse_holo: false,
  });
  const [filters, setFilters] = useState({
    first_edition: false,
    shadowless: false,
    pokemon_center_edition: false,
    prerelease: false,
    staff: false,
    tournament_card: false,
    error_card: false,
    foil: false,
    holo: false,
    reverse_holo: false,
  });
  const { addItem } = useCart();

  useEffect(() => {
    if (id && typeof id === "string") {
      loadCardData(id);
    }
  }, [id]);

  const loadCardData = async (identifier: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Try slug or ID (for backward compatibility)
      const cardData = await cardService.getCardBySlugOrId(identifier);
      
      if (!cardData) {
        setError("Card not found");
        return;
      }
      
      // Load available languages only for non-Lorcana (Lorcana traktujemy jako EN only)
      if (cardData.category_id !== 'disney-lorcana') {
        const languages = await cardService.getCardAvailableLanguages(cardData.id);
        console.log('Available languages for card:', languages);
        setAvailableLanguages(languages);
      } else {
        setAvailableLanguages([]);
      }
      
      // Load available variants for this card
      const variants = await cardService.getCardAvailableVariants(cardData.id);
      console.log('Available variants for card:', variants);
      setAvailableVariants(variants);
      
      // Load listings with current filters
      await loadListings(cardData.id);
      
      setCard(cardData);
      
      // Find set slug for the set name
      if (cardData.set_name) {
        try {
          const sets = await setService.getAllSets();
          const matchingSet = sets.find((s) => s.name === cardData.set_name);
          if (matchingSet) {
            setSetSlug(matchingSet.slug);
          }
        } catch (error) {
          console.error("Error loading sets:", error);
        }
      }
      
      // Redirect to slug URL if accessed via ID (for SEO and cleaner URLs)
      if (cardData.slug && identifier !== cardData.slug) {
        router.replace(`/card/${cardData.slug}`, undefined, { shallow: true });
      }
    } catch (error: any) {
      console.error("Error loading card data:", error);
      
      // Check if it's a "not found" error
      if (error?.message?.includes("not found") || error?.message?.includes("Card not found")) {
        setError(`Card not found: ${identifier}. The card may have been removed or doesn't exist in the database.`);
      } else {
        setError(error?.message || "Failed to load card. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadListings = async (cardId: string) => {
    try {
      console.log("[CardDetailPage] Loading listings for card_id:", cardId);
      const filterParams: any = {};
      
      // Add language filter
      if (selectedLanguages.length > 0) {
        filterParams.languages = selectedLanguages;
      }
      
      // Add variant filters (only if true)
      if (filters.first_edition) filterParams.first_edition = true;
      if (filters.shadowless) filterParams.shadowless = true;
      if (filters.pokemon_center_edition) filterParams.pokemon_center_edition = true;
      if (filters.prerelease) filterParams.prerelease = true;
      if (filters.staff) filterParams.staff = true;
      if (filters.tournament_card) filterParams.tournament_card = true;
      if (filters.error_card) filterParams.error_card = true;
      if (filters.foil) filterParams.foil = true;
      if (filters.holo) filterParams.holo = true;
      
      const listingsData = await cardService.getCardListings(cardId, filterParams);
      console.log("[CardDetailPage] Listings loaded:", {
        cardId,
        listingsCount: listingsData?.length || 0,
        listings: listingsData
      });
      setListings(listingsData || []);
    } catch (error) {
      console.error("[CardDetailPage] Error loading listings:", error);
      setListings([]);
    }
  };

  useEffect(() => {
    if (card?.id) {
      loadListings(card.id);
    }
  }, [selectedLanguages, filters, card?.id]);

  const sortedListings = [...listings].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      case "grade-high":
        return parseFloat(b.grade) - parseFloat(a.grade);
      default:
        return 0;
    }
  });

  const handleAddToCart = (listing: Slab, checkout = false) => {
    if (!card) return;

    addItem({
      id: `listing-${listing.id}`,
      cardId: card.id,
      name: listing.name ?? card.name,
      price: listing.price,
      imageUrl: listing.images?.[0] ?? card.image_url,
      gradingCompany: listing.grading_company?.code ?? null,
      grade: listing.grade ?? null,
      sellerName: listing.seller?.full_name ?? null,
      quantity: 1,
    });

    if (checkout) {
      router.push("/checkout");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <MainHeader />
        <div className="flex-1 flex items-center justify-center">
          <p>Loading...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!loading && !card) {
    return (
      <div className="min-h-screen flex flex-col">
        <MainHeader />
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Card Not Found
              </CardTitle>
              <CardDescription>
                {error || "The card you're looking for doesn't exist."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  <p>Error details: {error}</p>
                  <p className="mt-2">If you believe this is an error, please check:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>That the card ID or slug is correct</li>
                    <li>That the card exists in the database</li>
                    <li>That you have proper permissions to view the card</li>
                  </ul>
                </div>
              )}
              <div className="flex gap-2">
                <Button asChild variant="outline">
                  <Link href="/marketplace">Back to Marketplace</Link>
                </Button>
                <Button asChild>
                  <Link href="/">Go Home</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const lowestPrice = listings.length > 0 ? Math.min(...listings.map(l => l.price)) : null;
  const highestPrice = listings.length > 0 ? Math.max(...listings.map(l => l.price)) : null;
  const avgPrice = listings.length > 0 ? listings.reduce((sum, l) => sum + l.price, 0) / listings.length : null;

  const cardTitle = `${card.name}${card.card_number ? ` #${card.card_number}` : ""} - ${card.set_name}`;
  const setHref = setSlug
    ? `/marketplace?set=${encodeURIComponent(setSlug)}`
    : `/marketplace?set_name=${encodeURIComponent(card.set_name || "")}`;
  const cardDescription = `Buy and sell ${card.name}${card.card_number ? ` #${card.card_number}` : ""} from ${card.set_name}. ${listings.length} active listings available. ${lowestPrice ? `Starting at $${lowestPrice.toFixed(2)}.` : ""} PSA, BGS, CGC certified graded cards.`;
  const cardImage = card.image_url || "/og-image.jpg";
  const derivedYear = (() => {
    if (card.year) return card.year;
    if (card.set_name) {
      const enKey = `english-${card.set_name}`;
      const jpKey = `japanese-${card.set_name}`;
      return (
        (pokemonSetReleaseYears as any)[enKey] ||
        (pokemonSetReleaseYears as any)[jpKey] ||
        null
      );
    }
    return null;
  })();

  return (
    <>
      <SEO
        title={cardTitle}
        description={cardDescription}
        image={cardImage}
        type="product"
        keywords={[
          card.name,
          card.set_name,
          "graded card",
          "trading card",
          "Pokemon card",
          card.grading_company?.name || "PSA",
          "slab",
          "authenticated card",
        ]}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: cardTitle,
          description: cardDescription,
          image: cardImage,
          brand: {
            "@type": "Brand",
            name: card.set_name,
          },
          offers: listings.length > 0 ? {
            "@type": "AggregateOffer",
            priceCurrency: "USD",
            lowPrice: lowestPrice?.toFixed(2),
            highPrice: highestPrice?.toFixed(2),
            offerCount: listings.length,
            availability: "https://schema.org/InStock",
          } : undefined,
          category: "Trading Cards",
        }}
      />
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
        <MainHeader currentPage="marketplace" />

      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-6">
          <Link href="/" className="hover:text-blue-600">Home</Link>
          <span>/</span>
          <Link href="/marketplace" className="hover:text-blue-600">Marketplace</Link>
          <span>/</span>
          <span className="text-slate-900 dark:text-slate-100">{card.name}</span>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          {/* Card Image */}
          <div>
            <Card>
              <CardContent className="p-0">
                <div className="aspect-[3/4] bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-lg flex items-center justify-center">
                  {card.image_url ? (
                    <img src={card.image_url} alt={card.name} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <div className="text-9xl">🃏</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Card Info */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-start justify-between mb-2 relative">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold mb-2">{card.name}</h1>
                  <p className="text-lg text-slate-600 dark:text-slate-400">
                    <Link 
                      href={setHref}
                      className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors underline"
                    >
                      {card.set_name}
                    </Link>
                    {card.card_number && ` • #${card.card_number}`}
                    {derivedYear && ` • ${derivedYear}`}
                    {card.rarity && (
                      <> • <Badge className="inline-flex align-middle">{card.rarity}</Badge></>
                    )}
                  </p>
                  {/* Illustrator link: tylko dla nie-Lorcana */}
                  {card.category_id !== 'disney-lorcana' && card.description && (() => {
                    const match = card.description.match(/Illustrator:\s*([^\n]+)/i);
                    if (!match) return null;
                    const name = match[1].trim();
                    return (
                      <div className="mt-1">
                        <Link
                          href={`/marketplace?illustrator=${encodeURIComponent(name)}`}
                          className="text-sm underline transition-colors text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          Illustrator: {name}
                        </Link>
                  </div>
                    );
                  })()}
                </div>
                <div className="ml-4 flex-shrink-0" style={{ position: 'relative', zIndex: 99999 }}>
                  {card?.id && (
                    <AddCardToWishlistButton
                      cardId={card.id}
                      variant="outline"
                      size="icon"
                    />
                  )}
                </div>
              </div>

              {card.category_id !== 'disney-lorcana' && card.description && (
                (() => {
                  const cleaned = card.description.replace(/^Illustrator:\s*[^\n]+\n?/i, "");
                  return cleaned ? (
                <p className="text-slate-700 dark:text-slate-300 mt-4">
                      {cleaned}
                </p>
                  ) : null;
                })()
              )}
            </div>

            {/* Price Info */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Lowest Price</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${lowestPrice ? formatPrice(lowestPrice) : "N/A"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Average Price</p>
                  <p className="text-2xl font-bold">
                    ${avgPrice ? formatPrice(Math.round(avgPrice)) : "N/A"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Highest Price</p>
                  <p className="text-2xl font-bold text-red-600">
                    ${highestPrice ? formatPrice(highestPrice) : "N/A"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Stats and Filters */}
            <div className="flex flex-col gap-4">
              {/* Stats */}
              <div className="flex gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-slate-400" />
                  <span>{listings.length} available listing{listings.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-400" />
                  <span>{new Set(listings.map(l => l.seller_id)).size} unique seller{new Set(listings.map(l => l.seller_id)).size !== 1 ? 's' : ''}</span>
                </div>
              </div>

              {/* Filters Section */}
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {/* Language Filters – ukrywamy dla Lorcany */}
                    {card.category_id !== 'disney-lorcana' && (
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Language</Label>
                      {availableLanguages.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {availableLanguages.map((lang) => {
                            const isSelected = selectedLanguages.includes(lang);
                            const flagEmoji: Record<string, string> = {
                              english: '🇬🇧',
                              polish: '🇵🇱',
                              japanese: '🇯🇵',
                              french: '🇫🇷',
                              german: '🇩🇪',
                              spanish: '🇪🇸',
                              italian: '🇮🇹',
                              portuguese: '🇵🇹',
                              korean: '🇰🇷',
                              chinese: '🇨🇳',
                            };
                            return (
                              <label
                                key={lang}
                                className={`flex items-center gap-2 px-2 py-1 rounded-md border text-sm transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-blue-100 dark:bg-blue-900 border-blue-500 text-blue-900 dark:text-blue-100'
                                    : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                                }`}
                              >
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedLanguages([...selectedLanguages, lang]);
                                    } else {
                                      setSelectedLanguages(selectedLanguages.filter(l => l !== lang));
                                    }
                                  }}
                                />
                                <span className="capitalize">{lang}</span>
                              </label>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          No language data available for this card's listings. Language information will appear here once listings with language data are added.
                        </p>
                      )}
                    </div>
                    )}

                    {/* Variant Filters */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Variants</Label>
                      {card.category_id === 'disney-lorcana' ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="foil"
                              checked={filters.foil}
                              onCheckedChange={(checked) =>
                                setFilters({ ...filters, foil: checked === true })
                              }
                            />
                            <Label htmlFor="foil" className="text-sm cursor-pointer">Foil</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="holo"
                              checked={filters.holo}
                              onCheckedChange={(checked) =>
                                setFilters({ ...filters, holo: checked === true })
                              }
                            />
                            <Label htmlFor="holo" className="text-sm cursor-pointer">Holo</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="tournament"
                              checked={filters.tournament_card}
                              onCheckedChange={(checked) =>
                                setFilters({ ...filters, tournament_card: checked === true })
                              }
                            />
                            <Label htmlFor="tournament" className="text-sm cursor-pointer flex items-center gap-1">
                              <Trophy className="h-4 w-4" />
                              Tournament
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="error-card"
                              checked={filters.error_card}
                              onCheckedChange={(checked) =>
                                setFilters({ ...filters, error_card: checked === true })
                              }
                            />
                            <Label htmlFor="error-card" className="text-sm cursor-pointer flex items-center gap-1">
                              <AlertCircle className="h-4 w-4" />
                              Error Card
                            </Label>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="first-edition"
                                checked={filters.first_edition}
                                onCheckedChange={(checked) =>
                                  setFilters({ ...filters, first_edition: checked === true })
                                }
                              />
                              <Label htmlFor="first-edition" className="text-sm cursor-pointer flex items-center gap-1">
                                <div className="relative h-4 w-4">
                                  <Circle className="h-4 w-4" />
                                  <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold leading-none">1</span>
                                </div>
                                First Edition
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="shadowless"
                                checked={filters.shadowless}
                                onCheckedChange={(checked) =>
                                  setFilters({ ...filters, shadowless: checked === true })
                                }
                              />
                              <Label htmlFor="shadowless" className="text-sm cursor-pointer flex items-center gap-1">
                                <Square className="h-4 w-4 stroke-[1.5]" />
                                Shadowless
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="holo-variant"
                                checked={filters.holo}
                                onCheckedChange={(checked) =>
                                  setFilters({ ...filters, holo: checked === true })
                                }
                              />
                              <Label htmlFor="holo-variant" className="text-sm cursor-pointer">Holo</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="reverse-holo"
                                checked={filters.reverse_holo}
                                onCheckedChange={(checked) =>
                                  setFilters({ ...filters, reverse_holo: checked === true })
                                }
                              />
                              <Label htmlFor="reverse-holo" className="text-sm cursor-pointer">Reverse</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="pokemon-center"
                                checked={filters.pokemon_center_edition}
                                onCheckedChange={(checked) =>
                                  setFilters({ ...filters, pokemon_center_edition: checked === true })
                                }
                              />
                              <Label htmlFor="pokemon-center" className="text-sm cursor-pointer flex items-center gap-1">
                                <Building2 className="h-4 w-4" />
                                Pokemon Center
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="prerelease"
                                checked={filters.prerelease}
                                onCheckedChange={(checked) =>
                                  setFilters({ ...filters, prerelease: checked === true })
                                }
                              />
                              <Label htmlFor="prerelease" className="text-sm cursor-pointer flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                Prerelease
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="staff"
                                checked={filters.staff}
                                onCheckedChange={(checked) =>
                                  setFilters({ ...filters, staff: checked === true })
                                }
                              />
                              <Label htmlFor="staff" className="text-sm cursor-pointer flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                Staff
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="tournament"
                                checked={filters.tournament_card}
                                onCheckedChange={(checked) =>
                                  setFilters({ ...filters, tournament_card: checked === true })
                                }
                              />
                              <Label htmlFor="tournament" className="text-sm cursor-pointer flex items-center gap-1">
                                <Trophy className="h-4 w-4" />
                                Tournament
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="error-card"
                                checked={filters.error_card}
                                onCheckedChange={(checked) =>
                                  setFilters({ ...filters, error_card: checked === true })
                                }
                              />
                              <Label htmlFor="error-card" className="text-sm cursor-pointer flex items-center gap-1">
                                <AlertCircle className="h-4 w-4" />
                                Error Card
                              </Label>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Listings Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Available Offers ({listings.length})</h2>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="grade-high">Grade: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {sortedListings.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-lg text-slate-600 dark:text-slate-400">
                  No listings available for this card at the moment.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {sortedListings.map((listing) => (
                <Card key={listing.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Listing Info */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className="bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100">
                                {listing.grading_company?.code} {listing.grade}
                              </Badge>
                              {listing.cert_verified && (
                                <Badge className="bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100">
                                  <ShieldCheck className="h-3 w-3 mr-1" />
                                  Verified
                                </Badge>
                              )}
                            </div>
                            <CardEditionIcons
                              firstEdition={listing.first_edition}
                              shadowless={listing.shadowless}
                              pokemonCenterEdition={listing.pokemon_center_edition}
                              prerelease={listing.prerelease}
                              staff={listing.staff}
                              tournamentCard={listing.tournament_card}
                              errorCard={listing.error_card}
                            />
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              Cert #{listing.cert_number}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-3xl font-bold text-blue-600">
                              ${formatPrice(listing.price)}
                            </p>
                          </div>
                        </div>

                        {/* Seller Info */}
                        <div className="flex items-center gap-3 pt-3 border-t">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold shrink-0">
                            {listing.seller?.full_name?.[0] || "?"}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold">{listing.seller?.full_name || "Unknown Seller"}</p>
                            <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
                              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                              <span>4.8 (24 sales)</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" asChild>
                              <Link href={`/slab/${listing.id}`}>Details</Link>
                            </Button>
                            <AddToWishlistButton
                              slabId={listing.id}
                              variant="ghost"
                              size="sm"
                            />
                            <Button size="sm" variant="ghost" onClick={() => handleAddToCart(listing, false)}>
                              Add to Cart
                            </Button>
                            <Button size="sm" onClick={() => handleAddToCart(listing, true)}>
                              Buy Now
                            </Button>
                          </div>
                        </div>

                        {/* Shipping & Protection */}
                        <div className="flex gap-3 text-xs text-slate-600 dark:text-slate-400 pt-2">
                          {listing.escrow_protection && (
                            <span className="flex items-center gap-1">
                              <ShieldCheck className="h-3 w-3 text-green-600" />
                              Escrow
                            </span>
                          )}
                          {listing.buyer_protection && (
                            <span className="flex items-center gap-1">
                              <ShieldCheck className="h-3 w-3 text-blue-600" />
                              Protected
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            Insured Shipping
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
      </div>
    </>
  );
}
