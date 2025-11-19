import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { cartService } from "@/services/cartService";
import { toast } from "@/hooks/use-toast";

export interface CartItem {
  id: string; // listing id or fallback
  cardId: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  gradingCompany?: string | null;
  grade?: string | null;
  sellerName?: string | null;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  total: number;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  isSyncing: boolean;
  lastSyncError: string | null;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const STORAGE_KEY = "slab-market-cart";

function calculateTotal(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[];
        setItems(parsed);
      }
    } catch (error) {
      console.error("Failed to read cart from storage:", error);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, [items]);

  useEffect(() => {
    if (!user) {
      // Clear sync error when user logs out
      setLastSyncError(null);
      return;
    }
    
    // Only sync if there are items or if we need to clear the cart
    const sync = async () => {
      setIsSyncing(true);
      try {
        await cartService.syncCartItems(user.id, items);
        setLastSyncError(null);
      } catch (error) {
        console.warn("Failed to sync cart with Supabase:", error);
        // Only show error if it's not a network/connection issue
        const errorMessage = error instanceof Error ? error.message : "Nieudana synchronizacja koszyka.";
        // Don't show error for common non-critical issues
        if (!errorMessage.includes("network") && !errorMessage.includes("timeout")) {
          setLastSyncError(errorMessage);
        }
      } finally {
        setIsSyncing(false);
      }
    };

    // Debounce sync to avoid too many requests
    const timeoutId = setTimeout(sync, 500);
    return () => clearTimeout(timeoutId);
  }, [items, user]);

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((entry) => entry.id === item.id);
      if (existing) {
        return prev.map((entry) =>
          entry.id === item.id
            ? { ...entry, quantity: entry.quantity + item.quantity }
            : entry,
        );
      }

      return [...prev, item];
    });

    toast({
      title: "Dodano do koszyka",
      description: `${item.name} został dodany do koszyka.`,
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }

    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item)),
    );
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      total: calculateTotal(items),
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      isSyncing,
      lastSyncError,
    }),
    [items, isSyncing, lastSyncError, addItem, removeItem, updateQuantity, clearCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}

