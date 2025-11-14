import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Heart, Plus, Check, Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { wishlistService, type WishlistWithItems } from "@/services/wishlistService";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/router";

interface AddToWishlistButtonProps {
  slabId: string;
  onAdd?: () => void;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function AddToWishlistButton({
  slabId,
  onAdd,
  variant = "outline",
  size = "icon",
  className,
}: AddToWishlistButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [wishlists, setWishlists] = useState<WishlistWithItems[]>([]);
  const [loading, setLoading] = useState(false);
  const [inWishlists, setInWishlists] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadWishlists();
      checkIfInWishlist();
    }
  }, [user, slabId]);

  const loadWishlists = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await wishlistService.getUserWishlists(user.id);
      setWishlists(data || []);
    } catch (error) {
      console.error("Error loading wishlists:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkIfInWishlist = async () => {
    if (!user) return;

    try {
      const result = await wishlistService.checkIfInWishlist(user.id, slabId);
      if (result) {
        setInWishlists(result.map((w) => w.wishlist_id));
      } else {
        setInWishlists([]);
      }
    } catch (error) {
      console.error("Error checking wishlist:", error);
    }
  };

  const handleAddToWishlist = async (wishlistId: string) => {
    if (!user) {
      router.push("/auth/signin");
      return;
    }

    try {
      // Check if already in this wishlist
      if (inWishlists.includes(wishlistId)) {
        toast({
          title: "Already in wishlist",
          description: "This item is already in this wishlist",
          variant: "default",
        });
        return;
      }

      await wishlistService.addItemToWishlist({
        wishlist_id: wishlistId,
        slab_id: slabId,
      });

      setInWishlists([...inWishlists, wishlistId]);
      setOpen(false);
      
      const wishlist = wishlists.find((w) => w.id === wishlistId);
      toast({
        title: "Success",
        description: `Added to ${wishlist?.name || "wishlist"}`,
      });

      if (onAdd) {
        onAdd();
      }
    } catch (error: any) {
      console.error("Error adding to wishlist:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add to wishlist",
        variant: "destructive",
      });
    }
  };

  const handleRemoveFromWishlist = async (wishlistId: string) => {
    if (!user) return;

    try {
      await wishlistService.removeItemFromWishlist(wishlistId, slabId);
      setInWishlists(inWishlists.filter((id) => id !== wishlistId));
      
      const wishlist = wishlists.find((w) => w.id === wishlistId);
      toast({
        title: "Success",
        description: `Removed from ${wishlist?.name || "wishlist"}`,
      });

      if (onAdd) {
        onAdd();
      }
    } catch (error: any) {
      console.error("Error removing from wishlist:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove from wishlist",
        variant: "destructive",
      });
    }
  };

  const handleCreateNewWishlist = () => {
    router.push("/wishlists");
    setOpen(false);
  };

  if (!user) {
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => router.push("/auth/signin")}
        title="Sign in to add to wishlist"
      >
        <Heart className="h-5 w-5" />
      </Button>
    );
  }

  if (loading) {
    return (
      <Button variant={variant} size={size} className={className} disabled>
        <Heart className="h-5 w-5" />
      </Button>
    );
  }

  const hasWishlists = wishlists.length > 0;
  const isInAnyWishlist = inWishlists.length > 0;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
          title={isInAnyWishlist ? "Manage wishlists" : "Add to wishlist"}
        >
          <Heart className={`h-5 w-5 ${isInAnyWishlist ? "fill-red-500 text-red-500" : ""}`} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Add to Wishlist</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {hasWishlists ? (
          <>
            {wishlists.map((wishlist) => {
              const isInWishlist = inWishlists.includes(wishlist.id);
              return (
                <DropdownMenuItem
                  key={wishlist.id}
                  onClick={(e) => {
                    e.preventDefault();
                    if (isInWishlist) {
                      handleRemoveFromWishlist(wishlist.id);
                    } else {
                      handleAddToWishlist(wishlist.id);
                    }
                  }}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 flex-1">
                    {wishlist.is_default && (
                      <Star className="h-4 w-4 text-yellow-600" />
                    )}
                    <span className="truncate">{wishlist.name}</span>
                    <span className="text-xs text-slate-500">
                      ({wishlist.items_count || 0})
                    </span>
                  </div>
                  {isInWishlist && (
                    <Check className="h-4 w-4 text-green-600 ml-2" />
                  )}
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleCreateNewWishlist}>
              <Plus className="mr-2 h-4 w-4" />
              Create New Wishlist
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem onClick={handleCreateNewWishlist}>
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Wishlist
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

