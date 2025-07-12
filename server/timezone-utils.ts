import { DateTime } from "luxon";

/**
 * Timezone utility functions for consistent Asia/Kolkata timezone handling
 */
export const TIMEZONE = "Asia/Kolkata";

/**
 * Get current date and time in Asia/Kolkata timezone
 */
export function getCurrentISTDateTime(): DateTime {
  return DateTime.utc().setZone(TIMEZONE);
}

/**
 * Get current date in Asia/Kolkata timezone as JavaScript Date object
 */
export function getCurrentISTDate(): Date {
  return getCurrentISTDateTime().toJSDate();
}

/**
 * Convert any date to Asia/Kolkata timezone
 */
export function toISTDateTime(date: Date | string | DateTime): DateTime {
  if (date instanceof DateTime) {
    return date.setZone(TIMEZONE);
  }
  return DateTime.fromJSDate(new Date(date)).setZone(TIMEZONE);
}

/**
 * Get ISO string in Asia/Kolkata timezone
 */
export function getCurrentISTISOString(): string {
  return getCurrentISTDateTime().toISO() || getCurrentISTISOString();
}

/**
 * Format date for display in Asia/Kolkata timezone
 */
export function formatISTDate(date: Date | string | DateTime, format: string = "yyyy-MM-dd HH:mm:ss"): string {
  return toISTDateTime(date).toFormat(format);
}

/**
 * Check if a date is today in Asia/Kolkata timezone
 */
export function isToday(date: Date | string | DateTime): boolean {
  const istDate = toISTDateTime(date);
  const istToday = getCurrentISTDateTime();
  return istDate.hasSame(istToday, "day");
}

/**
 * Get start of day in Asia/Kolkata timezone
 */
export function getISTStartOfDay(date?: Date | string | DateTime): DateTime {
  const targetDate = date ? toISTDateTime(date) : getCurrentISTDateTime();
  return targetDate.startOf("day");
}

/**
 * Get end of day in Asia/Kolkata timezone
 */
export function getISTEndOfDay(date?: Date | string | DateTime): DateTime {
  const targetDate = date ? toISTDateTime(date) : getCurrentISTDateTime();
  return targetDate.endOf("day");
}