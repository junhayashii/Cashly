import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";

dayjs.extend(relativeTime);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

/**
 * Format date to readable string
 */
export function formatDate(
  date: string | Date,
  format: string = "MMM D, YYYY"
): string {
  return dayjs(date).format(format);
}

/**
 * Get relative time (e.g., "2 days ago")
 */
export function getRelativeTime(date: string | Date): string {
  return dayjs(date).fromNow();
}

/**
 * Check if date is in the past
 */
export function isPast(date: string | Date): boolean {
  return dayjs(date).isBefore(dayjs());
}

/**
 * Check if date is in the future
 */
export function isFuture(date: string | Date): boolean {
  return dayjs(date).isAfter(dayjs());
}

/**
 * Get start of month
 */
export function getStartOfMonth(date?: string | Date): string {
  return dayjs(date).startOf("month").format("YYYY-MM-DD");
}

/**
 * Get end of month
 */
export function getEndOfMonth(date?: string | Date): string {
  return dayjs(date).endOf("month").format("YYYY-MM-DD");
}

/**
 * Check if two dates are in the same month
 */
export function isSameMonth(date1: string | Date, date2: string | Date): boolean {
  return dayjs(date1).isSame(dayjs(date2), "month");
}

/**
 * Get month name
 */
export function getMonthName(date: string | Date): string {
  return dayjs(date).format("MMMM");
}

/**
 * Get year
 */
export function getYear(date: string | Date): number {
  return dayjs(date).year();
}
