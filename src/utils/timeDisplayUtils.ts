import { convertToUI } from './timezoneUtils';

/**
 * Common date/time format strings for consistent display
 * @deprecated Use convertToUI with mode parameter instead
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
 * @deprecated Use convertToUI instead
 */
export const formatTimeForDisplay = (
  date: Date | string | null,
  format: string,
  schoolTimezone: string
): string => {
  if (!date) return '-';
  // Map common formats to convertToUI modes
  if (format === 'M/d/yyyy') return convertToUI(date, schoolTimezone, 'date');
  if (format === 'HH:mm') return convertToUI(date, schoolTimezone, 'time');
  if (format === 'yyyy-MM-dd') return convertToUI(date, schoolTimezone, 'dateKey');
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