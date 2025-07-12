/**
 * Client-side timezone utility functions for consistent Asia/Kolkata timezone handling
 */
export const TIMEZONE = "Asia/Kolkata";

/**
 * Get current date and time in Asia/Kolkata timezone as ISO string
 */
export function getCurrentISTISOString(): string {
  return new Date().toLocaleString("sv-SE", { 
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit", 
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).replace(" ", "T") + ".000Z";
}

/**
 * Get current date in Asia/Kolkata timezone
 */
export function getCurrentISTDate(): Date {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
  return new Date(now.getTime() + istOffset);
}

/**
 * Format date for display in Asia/Kolkata timezone
 */
export function formatISTDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...options
  };
  
  return dateObj.toLocaleString("en-IN", defaultOptions);
}

/**
 * Check if a date is today in Asia/Kolkata timezone
 */
export function isToday(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = getCurrentISTDate();
  
  const dateInIST = new Date(dateObj.toLocaleString("en-US", { timeZone: TIMEZONE }));
  const todayInIST = new Date(today.toLocaleString("en-US", { timeZone: TIMEZONE }));
  
  return dateInIST.toDateString() === todayInIST.toDateString();
}

/**
 * Get time in Asia/Kolkata timezone for subscription scheduling
 */
export function getISTTime(): string {
  return getCurrentISTDate().toLocaleTimeString("en-IN", {
    timeZone: TIMEZONE,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit"
  });
}