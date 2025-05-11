import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a price to a localized currency string
 * @param price Price in rupees
 * @param currency Currency code (default: INR)
 * @returns Formatted price string
 */
export function formatPrice(price: number | undefined, currency: string = "INR"): string {
  if (price === undefined) return '₹0';
  
  // Check if price is likely in paise (high value) or already in rupees (lower value)
  // A typical millet meal shouldn't cost more than ₹1000, so we use that as threshold
  const finalPrice = price > 1000 ? price / 100 : price;
  
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(finalPrice);
}
