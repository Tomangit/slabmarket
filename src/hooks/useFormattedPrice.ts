import { useMemo } from "react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatPriceWithCurrency, getCurrencySymbol, EXCHANGE_RATES } from "@/services/currencyService";
import type { CurrencyCode } from "@/services/currencyService";

/**
 * Hook to format price with currency conversion
 * Uses synchronous conversion (may be slightly less accurate but avoids async issues)
 */
export function useFormattedPrice(
  price: number,
  fromCurrency: CurrencyCode = "USD",
  showSymbol: boolean = true
): string {
  const { currency } = useCurrency();

  const formattedPrice = useMemo(() => {
    if (!price || isNaN(price)) {
      return showSymbol ? `${getCurrencySymbol(fromCurrency)}0.00` : "0.00";
    }

    let convertedPrice = price;

    if (fromCurrency !== currency) {
      // Convert to USD first
      const usdAmount = price / (EXCHANGE_RATES[fromCurrency] || 1);
      // Convert to target currency
      convertedPrice = usdAmount * (EXCHANGE_RATES[currency] || 1);
      // Round to 2 decimal places
      convertedPrice = Math.round(convertedPrice * 100) / 100;
    }

    return formatPriceWithCurrency(convertedPrice, currency, showSymbol);
  }, [price, fromCurrency, currency, showSymbol]);

  return formattedPrice;
}

