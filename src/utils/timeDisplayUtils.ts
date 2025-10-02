import { convertToUI } from './timezoneUtils';

/**
 * Common date/time format strings for consistent display
 * @deprecated Use convertToUI directly instead
 */
export const TIME_FORMATS = {
  DATE_ONLY: 'MM/dd/yyyy',
  TIME_ONLY_24H: 'HH:mm',
  DATETIME_24H: 'MM/dd/yyyy HH:mm',
  DATETIME_12H: 'MM/dd/yyyy hh:mm a',
  FULL_DATE: 'EEEE, MMMM dd, yyyy',
  FULL_DATETIME_24H: 'EEEE, MMMM dd, yyyy HH:mm',
  SHORT_DATE: 'MMM dd, yyyy',
  SHORT_DATETIME_24H: 'MMM dd, yyyy HH:mm',
} as const;

/**
 * @deprecated Use convertToUI directly instead
 * Formats a date/time for display in the school's timezone
 * @param date - Date to format (UTC or local)
 * @param format - Format string to use
 * @param schoolTimezone - School's timezone
 * @returns Formatted date string in school timezone
 * 
 * @example
 * // Instead of this:
 * formatTimeForDisplay(date, TIME_FORMATS.DATETIME_24H, timezone)
 * 
 * // Use this:
 * convertToUI(date, timezone, 'datetime')
 */
export const formatTimeForDisplay = (
  date: Date | string | null,
  format: string,
  schoolTimezone: string
): string => {
  if (!date) return '-';
  // Map to convertToUI modes
  if (format.includes('HH:mm') && !format.includes('/')) {
    return convertToUI(date, schoolTimezone, 'time');
  }
  if (format.includes('/') && format.includes('HH:mm')) {
    return convertToUI(date, schoolTimezone, 'datetime');
  }
  if (format.includes('/')) {
    return convertToUI(date, schoolTimezone, 'date');
  }
  return convertToUI(date, schoolTimezone, 'datetime');
};

/**
 * Formats currency for display
 * @param amount - Amount to format
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number): string => {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
};