import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

/**
 * Formats a competition date string avoiding timezone conversion issues.
 * Takes a date string in YYYY-MM-DD format and returns M/d format (e.g., "5/2").
 * 
 * @param dateString - Date string in YYYY-MM-DD format from database
 * @param timezone - Optional timezone to format in (defaults to parsing as local date)
 * @returns Formatted date string in M/d format
 */
export const formatCompetitionDate = (dateString: string, timezone?: string): string => {
  try {
    if (timezone) {
      // Use timezone-aware formatting if timezone is provided
      return formatInTimeZone(new Date(dateString), timezone, 'M/d');
    } else {
      // Parse the date components manually to avoid timezone conversion
      const [year, month, day] = dateString.split('-').map(Number);
      
      // Create date object in local timezone
      const date = new Date(year, month - 1, day);
      
      // Format using date-fns
      return format(date, 'M/d');
    }
  } catch (error) {
    // Fallback to original string if parsing fails
    console.warn('Failed to format competition date:', dateString, error);
    return dateString;
  }
};

/**
 * Formats a competition date string for display with full date.
 * Takes a date string in YYYY-MM-DD format and returns M/d/yyyy format.
 * 
 * @param dateString - Date string in YYYY-MM-DD format from database
 * @param timezone - Optional timezone to format in (defaults to parsing as local date)
 * @returns Formatted date string in M/d/yyyy format
 */
export const formatCompetitionDateFull = (dateString: string, timezone?: string): string => {
  try {
    if (timezone) {
      // Use timezone-aware formatting if timezone is provided
      return formatInTimeZone(new Date(dateString), timezone, 'M/d/yyyy');
    } else {
      // Parse the date components manually to avoid timezone conversion
      const [year, month, day] = dateString.split('-').map(Number);
      
      // Create date object in local timezone
      const date = new Date(year, month - 1, day);
      
      // Format using date-fns
      return format(date, 'M/d/yyyy');
    }
  } catch (error) {
    // Fallback to original string if parsing fails
    console.warn('Failed to format competition date:', dateString, error);
    return dateString;
  }
};