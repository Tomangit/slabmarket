import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import {
  type CurrencyCode,
  getUserPreferredCurrency,
  updateUserPreferredCurrency,
  convertCurrency,
  formatPriceWithCurrency,
  getCurrencySymbol,
  SUPPORTED_CURRENCIES,
} from "@/services/currencyService";

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => Promise<void>;
  convertPrice: (price: number, fromCurrency?: CurrencyCode) => Promise<number>;
  formatPrice: (price: number, fromCurrency?: CurrencyCode, showSymbol?: boolean) => Promise<string>;
  getSymbol: () => string;
  supportedCurrencies: typeof SUPPORTED_CURRENCIES;
  loading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currency, setCurrencyState] = useState<CurrencyCode>("USD");
  const [loading, setLoading] = useState(true);

  // Load user's preferred currency on mount
  useEffect(() => {
    if (user) {
      loadUserCurrency();
    } else {
      // For non-logged-in users, try to get from localStorage or use USD
      const savedCurrency = localStorage.getItem("preferred_currency") as CurrencyCode | null;
      if (savedCurrency && SUPPORTED_CURRENCIES.some((c) => c.code === savedCurrency)) {
        setCurrencyState(savedCurrency);
      }
      setLoading(false);
    }
  }, [user]);

  const loadUserCurrency = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const preferredCurrency = await getUserPreferredCurrency(user.id);
      setCurrencyState(preferredCurrency);
      localStorage.setItem("preferred_currency", preferredCurrency);
    } catch (error) {
      console.error("Error loading user currency:", error);
    } finally {
      setLoading(false);
    }
  };

  const setCurrency = async (newCurrency: CurrencyCode) => {
    setCurrencyState(newCurrency);
    localStorage.setItem("preferred_currency", newCurrency);

    if (user) {
      try {
        await updateUserPreferredCurrency(user.id, newCurrency);
      } catch (error) {
        console.error("Error updating user currency:", error);
      }
    }
  };

  const convertPrice = async (price: number, fromCurrency: CurrencyCode = "USD"): Promise<number> => {
    if (fromCurrency === currency) {
      return price;
    }

    try {
      return await convertCurrency(price, fromCurrency, currency);
    } catch (error) {
      console.error("Error converting price:", error);
      return price; // Fallback to original price
    }
  };

  const formatPrice = async (
    price: number,
    fromCurrency: CurrencyCode = "USD",
    showSymbol: boolean = true
  ): Promise<string> => {
    try {
      const convertedPrice = await convertPrice(price, fromCurrency);
      return formatPriceWithCurrency(convertedPrice, currency, showSymbol);
    } catch (error) {
      console.error("Error formatting price:", error);
      return formatPriceWithCurrency(price, fromCurrency, showSymbol);
    }
  };

  const getSymbol = (): string => {
    return getCurrencySymbol(currency);
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        convertPrice,
        formatPrice,
        getSymbol,
        supportedCurrencies: SUPPORTED_CURRENCIES,
        loading,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}

