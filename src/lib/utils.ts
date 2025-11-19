import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Deterministic number formatting to prevent hydration mismatches
// Note: This function is kept for backward compatibility
// For currency-aware formatting, use useCurrency().formatPrice() hook
export function formatPrice(price: number): string {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}