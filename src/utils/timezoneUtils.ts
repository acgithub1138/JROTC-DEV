import { toZonedTime, fromZonedTime, formatInTimeZone } from 'date-fns-tz';
import { format, parse } from 'date-fns';

/**
 * Converts a UTC date to the school's timezone
 * @param date - Date in UTC
 * @param schoolTimezone - School's timezone (e.g., 'America/New_York')
 * @returns Date in school timezone
 */
export const convertToSchoolTimezone = (date: Date | string, schoolTimezone: string): Date => {
  const utcDate = typeof date === 'string' ? new Date(date) : date;
  return toZonedTime(utcDate, schoolTimezone);
};

/**
 * Converts a date from school timezone to UTC
 * @param date - Date in school timezone
 * @param schoolTimezone - School's timezone
 * @returns Date in UTC
 */
export const convertFromSchoolTimezone = (date: Date, schoolTimezone: string): Date => {
  return fromZonedTime(date, schoolTimezone);
};

/**
 * Formats a date in the school's timezone
 * @param date - Date to format (UTC or local)
 * @param formatString - Format string (e.g., 'yyyy-MM-dd', 'M/d/yyyy')
 * @param schoolTimezone - School's timezone
 * @returns Formatted date string in school timezone
 */
export const formatInSchoolTimezone = (
  date: Date | string,
  formatString: string,
  schoolTimezone: string
): string => {
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    // For YYYY-MM-DD strings, parse as local date in school timezone
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
  return formatInSchoolTimezone(date, 'yyyy-MM-dd', schoolTimezone);
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