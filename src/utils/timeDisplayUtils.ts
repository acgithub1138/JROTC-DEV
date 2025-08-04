import { formatInSchoolTimezone } from './timezoneUtils';

/**
 * Common date/time format strings for consistent display
 */
export const TIME_FORMATS = {
  DATE_ONLY: 'M/d/yyyy',
  TIME_ONLY_24H: 'HH:mm',
  DATETIME_24H: 'M/d/yyyy HH:mm',
  DATETIME_12H: 'M/d/yyyy h:mm a',
  FULL_DATE: 'EEEE, MMMM d, yyyy',
  FULL_DATETIME_24H: 'EEEE, MMMM d, yyyy HH:mm',
  SHORT_DATE: 'MMM d, yyyy',
  SHORT_DATETIME_24H: 'MMM d, yyyy HH:mm',
} as const;

/**
 * Formats a date/time for display in the school's timezone
 * @param date - Date to format (UTC or local)
 * @param format - Format string to use
 * @param schoolTimezone - School's timezone
 * @returns Formatted date string in school timezone
 */
export const formatTimeForDisplay = (
  date: Date | string | null,
  format: string,
  schoolTimezone: string
): string => {
  if (!date) return '-';
  return formatInSchoolTimezone(date, format, schoolTimezone);
};

/**
 * Formats currency for display
 * @param amount - Amount to format
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number): string => {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
};