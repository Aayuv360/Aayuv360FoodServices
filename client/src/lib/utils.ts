import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a price from cents/paise to a localized currency string
 * @param price Price in the smallest currency unit (cents/paise)
 * @param currency Currency code (default: INR)
 * @returns Formatted price string
 */
export function formatPrice(price: number, currency: string = 'INR'): string {
  // Convert from smallest unit (cents/paise) to standard unit
  const amount = price / 100;
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
