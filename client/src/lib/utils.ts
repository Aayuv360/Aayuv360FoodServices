import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a price to a localized currency string
 * @param price Price in paise (1/100 of a rupee)
 * @param currency Currency code (default: INR)
 * @returns Formatted price string
 */
export function formatPrice(price: number | undefined, currency: string = 'INR'): string {
  if (price === undefined) return '₹0';
  
  // Convert paise to rupees by dividing by 100
  const priceInRupees = price / 100;
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(priceInRupees);
}
