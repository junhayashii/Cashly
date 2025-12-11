/**
 * Utility functions for currency formatting
 */

/**
 * Format a number as currency
 */
export function formatCurrency(
  amount: number,
  currency: string = "$",
  decimals: number = 2
): string {
  return `${currency}${amount.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

/**
 * Parse currency string to number
 */
export function parseCurrency(value: string): number {
  return parseFloat(value.replace(/[^0-9.-]+/g, "")) || 0;
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 0): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return (value / total) * 100;
}
