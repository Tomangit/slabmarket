import { useState, useEffect, useRef } from "react";
import { Heart, Plus, Check, Star, Bell, BellOff, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { wishlistService, type WishlistWithItems } from "@/services/wishlistService";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface AddCardToWishlistButtonProps {
  cardId: string;
  onAdd?: () => void;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

// Grade options (1-10)
const GRADE_OPTIONS = [
  { value: "10", label: "10" },
  { value: "9", label: "9" },
  { value: "8", label: "8" },
  { value: "7", label: "7" },
  { value: "6", label: "6" },
  { value: "5", label: "5" },
  { value: "4", label: "4" },
  { value: "3", label: "3" },
  { value: "2", label: "2" },
  { value: "1", label: "1" },
];

export function AddCardToWishlistButton({
  cardId,
  onAdd,
  variant = "outline",
  size = "icon",
  className,
}: AddCardToWishlistButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [wishlists, setWishlists] = useState<WishlistWithItems[]>([]);
  const [inWishlists, setInWishlists] = useState<{ wishlist_id: string; min_grade?: string; notify_on_new_listing?: boolean }[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedWishlistId, setSelectedWishlistId] = useState<string | undefined>(undefined);
  const [minGrade, setMinGrade] = useState<string | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [notifyOnNewListing, setNotifyOnNewListing] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wishlistDropdownOpen, setWishlistDropdownOpen] = useState(false);
  const [gradeDropdownOpen, setGradeDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const wishlistDropdownRef = useRef<HTMLDivElement>(null);
  const gradeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && cardId) {
      loadWishlists();
      checkIfCardInWishlist();
    }
  }, [user, cardId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
      if (wishlistDropdownRef.current && !wishlistDropdownRef.current.contains(event.target as Node)) {
        setWishlistDropdownOpen(false);
      }
      if (gradeDropdownRef.current && !gradeDropdownRef.current.contains(event.target as Node)) {
        setGradeDropdownOpen(false);
      }
    };

    if (open || wishlistDropdownOpen || gradeDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, wishlistDropdownOpen, gradeDropdownOpen]);

  const loadWishlists = async () => {
    if (!user) return;

    try {
      const data = await wishlistService.getUserWishlists(user.id);
      setWishlists(data || []);
      // Set default wishlist if available
      const defaultWishlist = data?.find((w) => w.is_default);
      if (defaultWishlist) {
        setSelectedWishlistId(defaultWishlist.id);
      } else if (data && data.length > 0) {
        setSelectedWishlistId(data[0].id);
      } else {
        setSelectedWishlistId(undefined);
      }
    } catch (error) {
      console.error("Error loading wishlists:", error);
    }
  };

  const checkIfCardInWishlist = async () => {
    if (!user || !cardId) return;

    try {
      const result = await wishlistService.checkIfCardInWishlist(user.id, cardId);
      if (result) {
        setInWishlists(result.map((w) => ({
          wishlist_id: w.wishlist_id,
          min_grade: w.min_grade || undefined,
          notify_on_new_listing: w.notify_on_new_listing || false,
        })));
      } else {
        setInWishlists([]);
      }
    } catch (error) {
      console.error("Error checking wishlist:", error);
    }
  };

  const handleAddToWishlist = async () => {
    if (!user) {
      router.push("/auth/signin");
      return;
    }

    if (!selectedWishlistId) {
      toast({
        title: "Select a wishlist",
        description: "Please select a wishlist to add this card to",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if already in this wishlist
      const existing = inWishlists.find((w) => w.wishlist_id === selectedWishlistId);
      if (existing) {
        toast({
          title: "Already in wishlist",
          description: "This card is already in this wishlist",
          variant: "default",
        });
        setIsSubmitting(false);
        return;
      }

      await wishlistService.addItemToWishlist({
        wishlist_id: selectedWishlistId!,
        card_id: cardId,
        min_grade: minGrade || null,
        max_price: maxPrice && maxPrice.trim() !== "" ? parseFloat(maxPrice) : null,
        notify_on_new_listing: notifyOnNewListing,
      });

      // Refresh the inWishlists state
      await checkIfCardInWishlist();
      setOpen(false);
      
      const wishlist = wishlists.find((w) => w.id === selectedWishlistId);
      toast({
        title: "Success",
        description: `Card added to ${wishlist?.name || "wishlist"}`,
      });

      // Reset form
      setMinGrade(undefined);
      setMaxPrice("");
      setNotifyOnNewListing(false);

      if (onAdd) {
        onAdd();
      }
    } catch (error: any) {
      console.error("Error adding to wishlist:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add card to wishlist",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveFromWishlist = async (wishlistId: string) => {
    if (!user) return;

    try {
      await wishlistService.removeItemFromWishlist(wishlistId, { cardId });
      setInWishlists(inWishlists.filter((w) => w.wishlist_id !== wishlistId));
      
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
        onClick={() => {
          router.push("/auth/signin");
        }}
        title="Sign in to add to wishlist"
        type="button"
      >
        <Heart className="h-5 w-5" />
      </Button>
    );
  }

  if (!cardId) {
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        disabled
        title="No card available"
        type="button"
      >
        <Heart className="h-5 w-5" />
      </Button>
    );
  }

  const hasWishlists = wishlists.length > 0;
  const isInAnyWishlist = inWishlists.length > 0;

  return (
    <div className="relative inline-block" ref={containerRef}>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(!open);
        }}
        title={isInAnyWishlist ? "Manage wishlists" : "Add to wishlist"}
        type="button"
      >
        <Heart className={`h-5 w-5 ${isInAnyWishlist ? "fill-red-500 text-red-500" : ""}`} />
      </Button>
      {open && (
        <div className="absolute top-full right-0 mt-2 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg min-w-[20rem] max-w-md overflow-visible">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Add to Wants List</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCreateNewWishlist}
                className="text-xs h-7"
              >
                <Plus className="h-3 w-3 mr-1" />
                NEW LIST
              </Button>
            </div>

            {/* List Selection */}
            <div className="space-y-3 mb-4">
              <div className="relative" ref={wishlistDropdownRef}>
                <Label htmlFor="wishlist-select" className="text-xs font-medium mb-1 block">
                  List
                </Label>
                <button
                  type="button"
                  id="wishlist-select"
                  onClick={() => setWishlistDropdownOpen(!wishlistDropdownOpen)}
                  className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="truncate">
                    {selectedWishlistId 
                      ? wishlists.find(w => w.id === selectedWishlistId)?.name || "Select a wishlist"
                      : "Select a wishlist"
                    }
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </button>
                {wishlistDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-[9999] max-h-60 overflow-auto rounded-md border bg-white dark:bg-slate-800 text-popover-foreground shadow-md">
                    {wishlists.map((wishlist) => (
                      <div
                        key={wishlist.id}
                        onClick={() => {
                          setSelectedWishlistId(wishlist.id);
                          setWishlistDropdownOpen(false);
                        }}
                        className={`relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none hover:bg-accent hover:text-accent-foreground ${
                          selectedWishlistId === wishlist.id ? "bg-accent" : ""
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-1">
                          {wishlist.is_default && (
                            <Star className="h-3 w-3 text-yellow-600" />
                          )}
                          <span className="truncate">{wishlist.name}</span>
                          <span className="text-xs text-slate-500">
                            ({wishlist.items_count || 0})
                          </span>
                        </div>
                        {selectedWishlistId === wishlist.id && (
                          <Check className="absolute right-2 h-4 w-4" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Minimum Grade */}
              <div className="relative" ref={gradeDropdownRef}>
                <Label htmlFor="min-grade-select" className="text-xs font-medium mb-1 block">
                  Minimum Grade
                </Label>
                <button
                  type="button"
                  id="min-grade-select"
                  onClick={() => setGradeDropdownOpen(!gradeDropdownOpen)}
                  className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="truncate">
                    {minGrade ? GRADE_OPTIONS.find(o => o.value === minGrade)?.label : "Any Grade"}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </button>
                {gradeDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-[9999] max-h-60 overflow-auto rounded-md border bg-white dark:bg-slate-800 text-popover-foreground shadow-md">
                    <div
                      onClick={() => {
                        setMinGrade(undefined);
                        setGradeDropdownOpen(false);
                      }}
                      className={`relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none hover:bg-accent hover:text-accent-foreground ${
                        !minGrade ? "bg-accent" : ""
                      }`}
                    >
                      <span>Any Grade</span>
                      {!minGrade && (
                        <Check className="absolute right-2 h-4 w-4" />
                      )}
                    </div>
                    {GRADE_OPTIONS.map((option) => (
                      <div
                        key={option.value}
                        onClick={() => {
                          setMinGrade(option.value);
                          setGradeDropdownOpen(false);
                        }}
                        className={`relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none hover:bg-accent hover:text-accent-foreground ${
                          minGrade === option.value ? "bg-accent" : ""
                        }`}
                      >
                        <span>{option.label}</span>
                        {minGrade === option.value && (
                          <Check className="absolute right-2 h-4 w-4" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Max Price */}
              <div>
                <Label htmlFor="max-price-input" className="text-xs font-medium mb-1 block">
                  Max Price (optional)
                </Label>
                <div className="relative">
                  <Input
                    id="max-price-input"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="h-9 pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                    €
                  </span>
                </div>
              </div>

              {/* Email Alarm / Notifications */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notify-checkbox"
                  checked={notifyOnNewListing}
                  onCheckedChange={(checked) => setNotifyOnNewListing(checked === true)}
                />
                <Label
                  htmlFor="notify-checkbox"
                  className="text-xs font-normal cursor-pointer flex items-center gap-1"
                >
                  {notifyOnNewListing ? (
                    <Bell className="h-3 w-3" />
                  ) : (
                    <BellOff className="h-3 w-3" />
                  )}
                  Email Alarm (notify when new listing appears)
                </Label>
              </div>
            </div>

            {/* Add Button */}
            <Button
              onClick={handleAddToWishlist}
              disabled={isSubmitting || !selectedWishlistId}
              className="w-full"
              type="button"
            >
              {isSubmitting ? "Adding..." : "ADD TO WANTS LIST"}
            </Button>

            {/* Show existing wishlists this card is in */}
            {isInAnyWishlist && (
              <>
                <div className="h-px bg-slate-200 dark:bg-slate-700 my-3" />
                <div className="text-xs font-medium mb-2">Already in wishlists:</div>
                {inWishlists.map((item) => {
                  const wishlist = wishlists.find((w) => w.id === item.wishlist_id);
                  if (!wishlist) return null;
                  return (
                    <div
                      key={item.wishlist_id}
                      className="flex items-center justify-between px-2 py-1.5 text-sm rounded-sm hover:bg-slate-100 dark:hover:bg-slate-700 mb-1"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        {wishlist.is_default && (
                          <Star className="h-3 w-3 text-yellow-600" />
                        )}
                        <span className="truncate">{wishlist.name}</span>
                        {item.min_grade && (
                          <span className="text-xs text-slate-500">
                            (Min: {item.min_grade})
                          </span>
                        )}
                        {item.notify_on_new_listing && (
                          <Bell className="h-3 w-3 text-blue-600" />
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFromWishlist(item.wishlist_id)}
                        className="h-6 w-6 p-0"
                      >
                        ×
                      </Button>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

