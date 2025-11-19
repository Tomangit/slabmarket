import { useFormattedPrice } from "@/hooks/useFormattedPrice";
import type { CurrencyCode } from "@/services/currencyService";

interface PriceDisplayProps {
  price: number;
  fromCurrency?: CurrencyCode;
  showSymbol?: boolean;
  className?: string;
}

/**
 * Component to display price with currency conversion
 * Automatically converts price from fromCurrency to user's preferred currency
 */
export function PriceDisplay({
  price,
  fromCurrency = "USD",
  showSymbol = true,
  className,
}: PriceDisplayProps) {
  const formattedPrice = useFormattedPrice(price, fromCurrency, showSymbol);

  return <span className={className}>{formattedPrice}</span>;
}

