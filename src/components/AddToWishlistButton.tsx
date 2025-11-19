import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
  const [inWishlists, setInWishlists] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && slabId) {
      loadWishlists();
      checkIfInWishlist();
    }
  }, [user, slabId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const loadWishlists = async () => {
    if (!user) return;

    try {
      const data = await wishlistService.getUserWishlists(user.id);
      setWishlists(data || []);
    } catch (error) {
      console.error("Error loading wishlists:", error);
    }
  };

  const checkIfInWishlist = async () => {
    if (!user || !slabId) return;

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

  console.log('AddToWishlistButton: user:', user?.id, 'slabId:', slabId);

  if (!user) {
    console.log('AddToWishlistButton: No user, showing sign in button');
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => {
          console.log('Sign in button clicked');
          router.push("/auth/signin");
        }}
        title="Sign in to add to wishlist"
        type="button"
        style={{ pointerEvents: 'auto', cursor: 'pointer' }}
      >
        <Heart className="h-5 w-5" />
      </Button>
    );
  }

  if (!slabId) {
    console.log('AddToWishlistButton: No slabId provided');
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        disabled
        title="No listing available"
        type="button"
      >
        <Heart className="h-5 w-5" />
      </Button>
    );
  }

  const hasWishlists = wishlists.length > 0;
  const isInAnyWishlist = inWishlists.length > 0;


  console.log('AddToWishlistButton render, open:', open, 'slabId:', slabId, 'user:', user?.id, 'wishlists:', wishlists.length);

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('WISHLIST BUTTON CLICKED! open:', open, 'slabId:', slabId);
          setOpen(!open);
        }}
        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground h-9 w-9 cursor-pointer"
        title={isInAnyWishlist ? "Manage wishlists" : "Add to wishlist"}
        style={{ pointerEvents: 'auto' }}
      >
        <Heart className={`h-5 w-5 ${isInAnyWishlist ? "fill-red-500 text-red-500" : ""}`} style={{ pointerEvents: 'none' }} />
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg min-w-[14rem]">
          <div className="p-2">
            <div className="px-2 py-1.5 text-sm font-semibold">Add to Wishlist</div>
            <div className="h-px bg-slate-200 dark:bg-slate-700 my-1" />
            {hasWishlists ? (
              <>
                {wishlists.map((wishlist) => {
                  const isInWishlist = inWishlists.includes(wishlist.id);
                  return (
                    <div
                      key={wishlist.id}
                      onClick={(e) => {
                        e.preventDefault();
                        if (isInWishlist) {
                          handleRemoveFromWishlist(wishlist.id);
                        } else {
                          handleAddToWishlist(wishlist.id);
                        }
                      }}
                      className="flex items-center justify-between px-2 py-1.5 text-sm rounded-sm hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
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
                    </div>
                  );
                })}
                <div className="h-px bg-slate-200 dark:bg-slate-700 my-1" />
                <div
                  onClick={handleCreateNewWishlist}
                  className="flex items-center px-2 py-1.5 text-sm rounded-sm hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Wishlist
                </div>
              </>
            ) : (
              <div
                onClick={handleCreateNewWishlist}
                className="flex items-center px-2 py-1.5 text-sm rounded-sm hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Wishlist
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

