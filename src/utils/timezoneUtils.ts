import { toZonedTime, fromZonedTime, formatInTimeZone } from 'date-fns-tz';
import { format, parse } from 'date-fns';

/**
 * ============================================================================
 * CANONICAL TIMEZONE CONVERSION FUNCTIONS
 * ============================================================================
 * ALWAYS use these two functions for timezone conversion:
 * - convertToUTC: When saving to database
 * - convertToUI: When displaying to user
 * ============================================================================
 */

/**
 * Converts school-local date/time to UTC ISO string for database storage
 * @param dateKey - Date in YYYY-MM-DD format (school timezone)
 * @param timeHHmm - Time in HH:mm 24-hour format (school timezone)
 * @param timezone - School's IANA timezone
 * @param options - Optional flags (isAllDay: treat as all-day event)
 * @returns UTC ISO string for database storage
 * @example convertToUTC('2024-03-15', '14:30', 'America/New_York') // "2024-03-15T18:30:00.000Z"
 */
export const convertToUTC = (
  dateKey: string,
  timeHHmm: string,
  timezone: string,
  options?: { isAllDay?: boolean }
): string => {
  // For all-day events, use noon to avoid DST edge cases
  const time = options?.isAllDay ? '12:00' : timeHHmm;
  
  // Parse date and time components
  const [year, month, day] = dateKey.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  
  // Create date object in school timezone
  const schoolDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
  
  // Convert to UTC
  const utcDate = fromZonedTime(schoolDate, timezone);
  
  return utcDate.toISOString();
};

/**
 * Converts UTC timestamp to school timezone for UI display
 * @param utc - UTC timestamp (ISO string or Date object)
 * @param timezone - School's IANA timezone
 * @param mode - Output format: 'time' (HH:mm), 'date' (YYYY-MM-DD), 'datetime' (YYYY-MM-DD HH:mm), 'dateKey' (YYYY-MM-DD)
 * @returns Formatted string in school timezone
 * @example convertToUI('2024-03-15T18:30:00Z', 'America/New_York', 'time') // "14:30"
 */
export const convertToUI = (
  utc: string | Date | null,
  timezone: string,
  mode: 'time' | 'date' | 'datetime' | 'dateKey' = 'datetime'
): string => {
  if (!utc) return '-';
  
  const utcDate = typeof utc === 'string' ? new Date(utc) : utc;
  
  switch (mode) {
    case 'time':
      return formatInTimeZone(utcDate, timezone, 'HH:mm');
    case 'date':
      return formatInTimeZone(utcDate, timezone, 'M/d/yyyy');
    case 'dateKey':
      return formatInTimeZone(utcDate, timezone, 'yyyy-MM-dd');
    case 'datetime':
      return formatInTimeZone(utcDate, timezone, 'M/d/yyyy HH:mm');
    default:
      return formatInTimeZone(utcDate, timezone, 'M/d/yyyy HH:mm');
  }
};

/**
 * ============================================================================
 * DEPRECATED FUNCTIONS - Use convertToUTC and convertToUI instead
 * ============================================================================
 */

/**
 * @deprecated Use convertToUI instead
 */
export const convertToSchoolTimezone = (date: Date | string, schoolTimezone: string): Date => {
  const utcDate = typeof date === 'string' ? new Date(date) : date;
  return toZonedTime(utcDate, schoolTimezone);
};

/**
 * @deprecated Use convertToUTC instead
 */
export const convertFromSchoolTimezone = (date: Date, schoolTimezone: string): Date => {
  return fromZonedTime(date, schoolTimezone);
};

/**
 * @deprecated Use convertToUI instead
 */
export const formatInSchoolTimezone = (
  date: Date | string,
  formatString: string,
  schoolTimezone: string
): string => {
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split('-').map(Number);
    const localDate = new Date(year, month - 1, day);
    const utcDate = fromZonedTime(localDate, schoolTimezone);
    return formatInTimeZone(utcDate, schoolTimezone, formatString);
  }
  const utcDate = typeof date === 'string' ? new Date(date) : date;
  return formatInTimeZone(utcDate, schoolTimezone, formatString);
};

/**
 * Gets the formatted date key for grouping events by date in school timezone
 * @param date - Event date (UTC)
 * @param schoolTimezone - School's timezone
 * @returns Date key in YYYY-MM-DD format in school timezone
 */
export const getSchoolDateKey = (date: Date | string, schoolTimezone: string): string => {
  return convertToUI(date, schoolTimezone, 'dateKey');
};

/**
 * Checks if two dates are the same day in the school's timezone
 * @param date1 - First date
 * @param date2 - Second date
 * @param schoolTimezone - School's timezone
 * @returns True if dates are the same day in school timezone
 */
export const isSameDayInSchoolTimezone = (
  date1: Date | string,
  date2: Date | string,
  schoolTimezone: string
): boolean => {
  const key1 = getSchoolDateKey(date1, schoolTimezone);
  const key2 = getSchoolDateKey(date2, schoolTimezone);
  return key1 === key2;
};

/**
 * Common timezone options for US schools
 */
export const COMMON_TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
];

/**
 * Checks if a date (in YYYY-MM-DD format) is in the past relative to today in the school's timezone
 * @param dateKey - Date key in YYYY-MM-DD format
 * @param schoolTimezone - School's timezone
 * @returns True if the date is in the past in school timezone
 */
export const isDatePastInSchoolTimezone = (dateKey: string, schoolTimezone: string): boolean => {
  const today = new Date();
  const todayKey = getSchoolDateKey(today, schoolTimezone);
  return dateKey < todayKey;
};

/**
 * Gets the display name for a timezone
 * @param timezone - IANA timezone string
 * @returns Human-readable timezone name
 */
export const getTimezoneDisplayName = (timezone: string): string => {
  const found = COMMON_TIMEZONES.find(tz => tz.value === timezone);
  return found ? found.label : timezone;
};