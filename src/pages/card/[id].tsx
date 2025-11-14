
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MainHeader } from "@/components/MainHeader";
import { Footer } from "@/components/Footer";
import { ShieldCheck, Heart, Star, Package, User, Circle, Square, Building2, Calendar, Users, Trophy, AlertCircle } from "lucide-react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { cardService } from "@/services/cardService";
import type { Database } from "@/integrations/supabase/types";
import { useCart } from "@/contexts/CartContext";

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
  const [sortBy, setSortBy] = useState("price-low");
  const { addItem } = useCart();

  useEffect(() => {
    if (id && typeof id === "string") {
      loadCardData(id);
    }
  }, [id]);

  const loadCardData = async (cardId: string) => {
    try {
      setLoading(true);
      const [cardData, listingsData] = await Promise.all([
        cardService.getCardById(cardId),
        cardService.getCardListings(cardId)
      ]);
      setCard(cardData);
      setListings(listingsData);
    } catch (error) {
      console.error("Error loading card data:", error);
    } finally {
      setLoading(false);
    }
  };

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

  if (!card) {
    return (
      <div className="min-h-screen flex flex-col">
        <MainHeader />
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Card Not Found</CardTitle>
              <CardDescription>The card you&apos;re looking for doesn&apos;t exist.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/marketplace">Back to Marketplace</Link>
              </Button>
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

  return (
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
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{card.name}</h1>
                  <p className="text-lg text-slate-600 dark:text-slate-400">
                    {card.set_name} {card.card_number && `• #${card.card_number}`}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    {card.rarity && (
                      <Badge>{card.rarity}</Badge>
                    )}
                  </div>
                </div>
                <Button variant="outline" size="icon">
                  <Heart className="h-5 w-5" />
                </Button>
              </div>

              {card.description && (
                <p className="text-slate-700 dark:text-slate-300 mt-4">
                  {card.description}
                </p>
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
  );
}
