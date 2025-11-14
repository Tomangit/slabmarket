import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { MainHeader } from "@/components/MainHeader";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { wishlistService, type WishlistWithItems, type WishlistItemWithSlab } from "@/services/wishlistService";
import { Heart, ArrowLeft, Trash2, Search, Star, Eye, ShoppingCart, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";

export default function WishlistDetailPage() {
  const t = useTranslations();
  const router = useRouter();
  const { id } = router.query;
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { addItem } = useCart();
  const [wishlist, setWishlist] = useState<WishlistWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WishlistItemWithSlab | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/signin");
      return;
    }

    if (user && id && typeof id === "string") {
      loadWishlist();
    }
  }, [user, authLoading, id]);

  const loadWishlist = async () => {
    if (!user || !id || typeof id !== "string") return;

    try {
      setLoading(true);
      const data = await wishlistService.getWishlist(id, user.id);
      if (!data) {
        toast({
          title: "Error",
          description: "Wishlist not found",
          variant: "destructive",
        });
        router.push("/wishlists");
        return;
      }
      setWishlist(data);
    } catch (error) {
      console.error("Error loading wishlist:", error);
      toast({
        title: "Error",
        description: "Failed to load wishlist",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (item: WishlistItemWithSlab) => {
    if (!wishlist) return;

    try {
      await wishlistService.removeItemFromWishlist(wishlist.id, item.slab_id);
      toast({
        title: "Success",
        description: "Item removed from wishlist",
      });
      loadWishlist();
    } catch (error: any) {
      console.error("Error removing item:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove item",
        variant: "destructive",
      });
    }
  };

  const handleAddToCart = (slab: any) => {
    if (!slab) return;

    try {
      addItem({
        id: slab.id,
        name: slab.name,
        price: slab.price,
        image: slab.images && slab.images.length > 0 ? slab.images[0] : null,
        grade: slab.grade,
        gradingCompany: slab.grading_company?.name || "Unknown",
      });

      toast({
        title: "Success",
        description: "Item added to cart",
      });
    } catch (error: any) {
      console.error("Error adding to cart:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add to cart",
        variant: "destructive",
      });
    }
  };

  const openDeleteDialog = (item: WishlistItemWithSlab) => {
    setSelectedItem(item);
    setDeleteDialogOpen(true);
  };

  const filteredItems = wishlist?.items?.filter((item) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.slab?.name?.toLowerCase().includes(query) ||
      item.slab?.category?.name?.toLowerCase().includes(query) ||
      item.slab?.grading_company?.name?.toLowerCase().includes(query)
    );
  }) || [];

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
        <MainHeader currentPage="wishlists" />
        <div className="container mx-auto px-4 py-10 flex-1">
          <div className="text-center">Loading...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!wishlist) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <MainHeader currentPage="wishlists" />

      <div className="container mx-auto px-4 py-10 flex-1 w-full max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" className="mb-4" asChild>
            <Link href="/wishlists">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Wishlists
            </Link>
          </Button>
          
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <Heart className="h-10 w-10 text-pink-600" />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-4xl font-bold">{wishlist.name}</h1>
                  {wishlist.is_default && (
                    <Badge variant="secondary" className="text-xs">
                      <Star className="h-3 w-3 mr-1" />
                      Default
                    </Badge>
                  )}
                </div>
                {wishlist.description && (
                  <p className="text-slate-600 dark:text-slate-400 mt-1">
                    {wishlist.description}
                  </p>
                )}
                <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
                  {wishlist.items_count || 0} {wishlist.items_count === 1 ? "item" : "items"}
                </p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link href="/marketplace">
                <Search className="mr-2 h-4 w-4" />
                Browse Marketplace
              </Link>
            </Button>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search items in this wishlist..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Items Grid */}
        {filteredItems.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Heart className="h-12 w-12 mx-auto text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? "No items found" : wishlist.items_count === 0 ? "This wishlist is empty" : "No items match your search"}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                {searchQuery
                  ? "Try adjusting your search query"
                  : "Add cards to this wishlist to organize your favorites"}
              </p>
              {!searchQuery && (
                <Button asChild>
                  <Link href="/marketplace">
                    <Search className="mr-2 h-4 w-4" />
                    Browse Marketplace
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => {
              const slab = item.slab;
              if (!slab) return null;

              const imageUrl = slab.images && Array.isArray(slab.images) && slab.images.length > 0 
                ? slab.images[0] 
                : null;

              return (
                <Card key={item.id} className="hover:shadow-lg transition-shadow group">
                  <Link href={`/slab/${slab.id}`}>
                    <CardHeader className="p-0">
                      <div className="relative aspect-[3/4] bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-t-lg overflow-hidden">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={slab.name || "Slab"}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            loading="lazy"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-6xl">
                            🃏
                          </div>
                        )}
                        {slab.status === "sold" && (
                          <div className="absolute top-2 left-2">
                            <Badge variant="destructive">Sold</Badge>
                          </div>
                        )}
                        {slab.grading_company && (
                          <div className="absolute bottom-2 left-2">
                            <Badge variant="secondary" className="text-xs">
                              {slab.grading_company.code} {slab.grade}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                  </Link>
                  <CardContent className="p-4">
                    <Link href={`/slab/${slab.id}`}>
                      <h3 className="font-semibold mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {slab.name}
                      </h3>
                      {slab.category && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 line-clamp-1">
                          {slab.category.name}
                        </p>
                      )}
                    </Link>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl font-bold text-blue-600">
                        ${formatPrice(slab.price)}
                      </span>
                      {slab.status === "active" && (
                        <Badge variant="outline" className="text-xs text-green-600">
                          Available
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.preventDefault();
                          handleAddToCart(slab);
                        }}
                        disabled={slab.status !== "active"}
                      >
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Add to Cart
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={(e) => {
                          e.preventDefault();
                          openDeleteDialog(item);
                        }}
                        title="Remove from wishlist"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Delete Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Item from Wishlist</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove "{selectedItem?.slab?.name}" from this wishlist? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (selectedItem) {
                    handleRemoveItem(selectedItem);
                    setDeleteDialogOpen(false);
                    setSelectedItem(null);
                  }
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Footer />
    </div>
  );
}

