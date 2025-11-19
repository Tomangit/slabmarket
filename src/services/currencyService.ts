import { supabase } from "@/integrations/supabase/client";

// Supported currencies (ISO 4217 codes)
export const SUPPORTED_CURRENCIES = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "PLN", name: "Polish Zloty", symbol: "zł" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
] as const;

export type CurrencyCode = typeof SUPPORTED_CURRENCIES[number]["code"];

// Exchange rates (base: USD)
// In production, these would be fetched from an API like exchangerate-api.com or fixer.io
// For now, we'll use static rates that can be updated
export const EXCHANGE_RATES: Record<CurrencyCode, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  PLN: 4.02,
  CAD: 1.35,
  AUD: 1.52,
  JPY: 149.5,
  CHF: 0.88,
  CNY: 7.24,
};

// Cache for exchange rates (to avoid frequent API calls)
let exchangeRatesCache: Record<CurrencyCode, number> | null = null;
let exchangeRatesCacheTimestamp: number = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

/**
 * Get exchange rates (with caching)
 * In production, this would fetch from an API
 */
async function getExchangeRates(): Promise<Record<CurrencyCode, number>> {
  const now = Date.now();
  
  // Return cached rates if still valid
  if (exchangeRatesCache && (now - exchangeRatesCacheTimestamp) < CACHE_DURATION) {
    return exchangeRatesCache;
  }

  // In production, fetch from API:
  // try {
  //   const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
  //   const data = await response.json();
  //   exchangeRatesCache = data.rates;
  //   exchangeRatesCacheTimestamp = now;
  //   return exchangeRatesCache;
  // } catch (error) {
  //   console.error('Error fetching exchange rates:', error);
  //   // Fallback to static rates
  // }

  // For now, use static rates
  exchangeRatesCache = EXCHANGE_RATES;
  exchangeRatesCacheTimestamp = now;
  return exchangeRatesCache;
}

/**
 * Convert price from one currency to another
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode
): Promise<number> {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  const rates = await getExchangeRates();
  
  // Convert to USD first, then to target currency
  const usdAmount = amount / rates[fromCurrency];
  const convertedAmount = usdAmount * rates[toCurrency];
  
  return Math.round(convertedAmount * 100) / 100; // Round to 2 decimal places
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: CurrencyCode): string {
  const currencyInfo = SUPPORTED_CURRENCIES.find((c) => c.code === currency);
  return currencyInfo?.symbol || "$";
}

/**
 * Get currency name
 */
export function getCurrencyName(currency: CurrencyCode): string {
  const currencyInfo = SUPPORTED_CURRENCIES.find((c) => c.code === currency);
  return currencyInfo?.name || "US Dollar";
}

/**
 * Format price with currency symbol
 */
export function formatPriceWithCurrency(
  price: number,
  currency: CurrencyCode = "USD",
  showSymbol: boolean = true
): string {
  const symbol = showSymbol ? getCurrencySymbol(currency) : "";
  const formattedPrice = price.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // For some currencies, symbol comes after (e.g., "100.00 zł")
  if (currency === "PLN") {
    return `${formattedPrice} ${symbol}`.trim();
  }

  // For most currencies, symbol comes before (e.g., "$100.00")
  return `${symbol}${formattedPrice}`.trim();
}

/**
 * Get user's preferred currency from profile
 */
export async function getUserPreferredCurrency(userId: string): Promise<CurrencyCode> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("preferred_currency")
      .eq("id", userId)
      .single();

    // Handle 406 errors and other RLS/permission errors gracefully
    if (error) {
      // 406 = Not Acceptable (often RLS/permission issue)
      // PGRST116 = No rows returned
      // 42501 = Insufficient privilege
      // PGRST301 = Permission denied
      if (
        error.code === "PGRST116" ||
        error.code === "42501" ||
        error.code === "PGRST301" ||
        error.message?.includes("406") ||
        error.message?.includes("Not Acceptable")
      ) {
        // Profile doesn't exist or access denied - return default
        return "USD";
      }
      // For other errors, log but return default
      console.warn("Error fetching user preferred currency:", error);
      return "USD";
    }

    if (!data) {
      return "USD"; // Default to USD
    }

    return (data.preferred_currency as CurrencyCode) || "USD";
  } catch (error) {
    console.error("Error fetching user preferred currency:", error);
    return "USD"; // Default to USD
  }
}

/**
 * Update user's preferred currency
 */
export async function updateUserPreferredCurrency(
  userId: string,
  currency: CurrencyCode
): Promise<void> {
  try {
    const { error } = await supabase
      .from("profiles")
      .update({ preferred_currency: currency })
      .eq("id", userId);

    if (error) {
      // Handle 406 errors and other RLS/permission errors
      if (
        error.code === "42501" ||
        error.code === "PGRST301" ||
        error.message?.includes("406") ||
        error.message?.includes("Not Acceptable")
      ) {
        console.warn("Permission denied updating user preferred currency:", error);
        // Don't throw - user can still use the currency locally
        return;
      }
      throw error;
    }
  } catch (error) {
    console.error("Error updating user preferred currency:", error);
    // Only throw if it's not a permission error
    if (
      error instanceof Error &&
      !error.message?.includes("406") &&
      !error.message?.includes("Not Acceptable")
    ) {
      throw error;
    }
  }
}

