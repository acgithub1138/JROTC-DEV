# Timezone Implementation Guide

This guide provides comprehensive instructions for implementing timezone-aware date/time handling in a React + Supabase project. The system ensures dates are stored in UTC and displayed in the user's local timezone.

## Table of Contents

1. [Core Principles](#core-principles)
2. [Required Dependencies](#required-dependencies)
3. [Database Setup](#database-setup)
4. [File Structure](#file-structure)
5. [Core Utility Functions](#core-utility-functions)
6. [React Hook](#react-hook)
7. [Usage Patterns](#usage-patterns)
8. [Common Pitfalls](#common-pitfalls)
9. [Testing Checklist](#testing-checklist)

---

## Core Principles

1. **Database Storage**: Always store dates in UTC (ISO 8601 format)
2. **User Display**: Always show dates in the user's local timezone
3. **User Input**: Always interpret input in the user's local timezone
4. **Consistency**: Use the same conversion functions throughout the application

---

## Required Dependencies

```bash
npm install date-fns date-fns-tz
```

**Important**: This implementation uses `date-fns-tz` v3.x which has breaking changes from v2.x:
- `utcToZonedTime` → renamed to `toZonedTime`
- `zonedTimeToUtc` → renamed to `fromZonedTime`
- All functions use named exports

---

## Database Setup

### 1. Add Timezone Column to Your Organization/School Table

```sql
-- Add timezone column to your organization table
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/New_York';

-- Or if creating a new table
CREATE TABLE public.schools (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  timezone TEXT DEFAULT 'America/New_York',
  -- ... other columns
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

### 2. Ensure Date Columns Use TIMESTAMP WITH TIME ZONE

```sql
-- For existing tables, convert columns if needed
ALTER TABLE public.events 
  ALTER COLUMN start_date TYPE TIMESTAMP WITH TIME ZONE,
  ALTER COLUMN end_date TYPE TIMESTAMP WITH TIME ZONE;

-- For new tables, always use TIMESTAMPTZ
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,  -- Stores UTC
  end_date TIMESTAMP WITH TIME ZONE,              -- Stores UTC
  -- ... other columns
);
```

---

## File Structure

```
src/
├── hooks/
│   └── useSchoolTimezone.ts      # Hook to fetch user's timezone
├── utils/
│   └── timezoneUtils.ts          # Core conversion utilities
└── components/
    └── [your components using timezone]
```

---

## Core Utility Functions

### `src/utils/timezoneUtils.ts`

```typescript
import { toZonedTime, fromZonedTime, formatInTimeZone } from 'date-fns-tz';

/**
 * ============================================================================
 * TIMEZONE UTILITIES
 * ============================================================================
 * 
 * Core Principles:
 * 1. Database Storage: Always store dates in UTC (ISO 8601 format)
 * 2. User Display: Always show dates in the user's local timezone
 * 3. User Input: Always interpret input in the user's local timezone
 */

/**
 * Converts local date/time to UTC ISO string for database storage
 * @param dateKey - Date in YYYY-MM-DD format (local timezone)
 * @param timeHHmm - Time in HH:mm 24-hour format (local timezone)
 * @param timezone - User's IANA timezone (e.g., 'America/New_York')
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
  
  // Create date object in local timezone
  const localDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
  
  // Convert to UTC
  const utcDate = fromZonedTime(localDate, timezone);
  
  return utcDate.toISOString();
};

/**
 * Converts UTC timestamp to local timezone for UI display
 * @param utc - UTC timestamp (ISO string or Date object)
 * @param timezone - User's IANA timezone
 * @param mode - Output format: 'time' (HH:mm), 'date' (MM/dd/yyyy), 'datetime' (MM/dd/yyyy HH:mm), 'dateKey' (yyyy-MM-dd)
 * @returns Formatted string in local timezone
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
      return formatInTimeZone(utcDate, timezone, 'MM/dd/yyyy');
    case 'dateKey':
      return formatInTimeZone(utcDate, timezone, 'yyyy-MM-dd');
    case 'datetime':
      return formatInTimeZone(utcDate, timezone, 'MM/dd/yyyy HH:mm');
    default:
      return formatInTimeZone(utcDate, timezone, 'MM/dd/yyyy HH:mm');
  }
};

/**
 * Gets the formatted date key for grouping by date in local timezone
 * @param date - Date (UTC)
 * @param timezone - User's timezone
 * @returns Date key in YYYY-MM-DD format in local timezone
 */
export const getSchoolDateKey = (date: Date | string, timezone: string): string => {
  return convertToUI(date, timezone, 'dateKey');
};

/**
 * Checks if two dates are the same day in the user's timezone
 */
export const isSameDayInSchoolTimezone = (
  date1: Date | string,
  date2: Date | string,
  timezone: string
): boolean => {
  const key1 = getSchoolDateKey(date1, timezone);
  const key2 = getSchoolDateKey(date2, timezone);
  return key1 === key2;
};

/**
 * Checks if a date is in the past relative to today in the user's timezone
 * @param dateKey - Date key in YYYY-MM-DD format
 * @param timezone - User's timezone
 */
export const isDatePastInSchoolTimezone = (dateKey: string, timezone: string): boolean => {
  const today = new Date();
  const todayKey = getSchoolDateKey(today, timezone);
  return dateKey < todayKey;
};

/**
 * Common timezone options for US
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
 * Gets the display name for a timezone
 */
export const getTimezoneDisplayName = (timezone: string): string => {
  const found = COMMON_TIMEZONES.find(tz => tz.value === timezone);
  return found ? found.label : timezone;
};
```

---

## React Hook

### `src/hooks/useSchoolTimezone.ts`

```typescript
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useSchoolTimezone = () => {
  const [timezone, setTimezone] = useState<string>('America/New_York'); // Default fallback
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userProfile } = useAuth();

  useEffect(() => {
    const fetchSchoolTimezone = async () => {
      if (!userProfile?.school_id) {
        setIsLoading(false);
        return;
      }

      try {
        setError(null);
        const { data, error } = await supabase
          .from('schools')
          .select('timezone')
          .eq('id', userProfile.school_id)
          .single();

        if (error) {
          setError('Failed to fetch timezone');
        } else if (data?.timezone) {
          setTimezone(data.timezone);
        }
      } catch (error) {
        setError('Network error fetching timezone');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchoolTimezone();
  }, [userProfile?.school_id]);

  return { timezone, isLoading, error };
};
```

**Note**: Adjust the hook based on your auth context and organization structure. The key is fetching the timezone from wherever it's stored for the current user.

---

## Usage Patterns

### Pattern 1: Saving Form Data to Database

```typescript
import { convertToUTC } from '@/utils/timezoneUtils';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';

const EventForm = () => {
  const { timezone } = useSchoolTimezone();
  
  const handleSubmit = async (formData: { date: string; time: string; title: string }) => {
    // Convert local date/time to UTC for storage
    const startTimeUTC = convertToUTC(
      formData.date,      // "2024-03-15" (YYYY-MM-DD)
      formData.time,      // "14:30" (HH:mm)
      timezone
    );
    
    await supabase.from('events').insert({
      title: formData.title,
      start_date: startTimeUTC,  // Stored as UTC
    });
  };
};
```

### Pattern 2: Displaying Data from Database

```typescript
import { convertToUI } from '@/utils/timezoneUtils';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';

const EventCard = ({ event }) => {
  const { timezone } = useSchoolTimezone();
  
  // Convert UTC to local for display
  const displayTime = convertToUI(event.start_date, timezone, 'datetime');
  // Returns: "03/15/2024 14:30" in user's timezone
  
  return <div>{displayTime}</div>;
};
```

### Pattern 3: Editing Existing Data (Loading into Form)

```typescript
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';

const EditEventForm = ({ existingEvent }) => {
  const { timezone } = useSchoolTimezone();
  const [formData, setFormData] = useState({ date: '', time: '' });
  
  useEffect(() => {
    if (existingEvent && timezone) {
      // Convert UTC from database back to local timezone for form fields
      const utcDate = new Date(existingEvent.start_date);
      setFormData({
        date: formatInTimeZone(utcDate, timezone, 'yyyy-MM-dd'),  // For date input
        time: formatInTimeZone(utcDate, timezone, 'HH:mm'),       // For time input
      });
    }
  }, [existingEvent, timezone]);
  
  // ... render form with formData
};
```

### Pattern 4: Custom Date Formatting

```typescript
import { formatInTimeZone } from 'date-fns-tz';

// For custom formats beyond convertToUI modes
const customFormat = formatInTimeZone(
  utcDate,
  timezone,
  'EEEE, MMMM d, yyyy \'at\' h:mm a'
);
// Returns: "Friday, March 15, 2024 at 2:30 PM"
```

### Pattern 5: All-Day Events

```typescript
import { convertToUTC } from '@/utils/timezoneUtils';

// All-day events use noon to avoid DST edge cases
const allDayEventUTC = convertToUTC(
  '2024-03-15',
  '00:00',  // Time is ignored when isAllDay is true
  timezone,
  { isAllDay: true }  // Uses 12:00 internally
);
```

### Pattern 6: Date-Only Fields (No Timezone Conversion)

For fields that store only a date (DATE type, not TIMESTAMP), do NOT use timezone conversion:

```typescript
// For date-only fields like budget.date
// Store as YYYY-MM-DD string directly
// Display with simple string manipulation

const formatDateDisplay = (dateString: string) => {
  if (!dateString) return '-';
  const [year, month, day] = dateString.split('-');
  return `${month}/${day}/${year}`;  // "03/15/2024"
};

// DO NOT use timezone conversion for date-only fields
// This would cause incorrect dates near midnight
```

---

## Common Pitfalls

### 1. Double Conversion

**Problem**: Converting timezone twice when editing and saving.

```typescript
// ❌ WRONG - Converting already-converted data
const loadData = () => {
  const local = convertToUI(event.start_date, timezone, 'datetime');
  // ...later when saving...
  const utc = convertToUTC(local, timezone); // Double conversion!
};

// ✅ CORRECT - Convert once on load, once on save
const loadData = () => {
  // Load: UTC → local form fields
  const date = formatInTimeZone(new Date(event.start_date), timezone, 'yyyy-MM-dd');
  const time = formatInTimeZone(new Date(event.start_date), timezone, 'HH:mm');
};

const saveData = () => {
  // Save: local form fields → UTC
  const utc = convertToUTC(formData.date, formData.time, timezone);
};
```

### 2. Using Date-Only Fields with Timezone Conversion

**Problem**: Applying timezone conversion to DATE type columns.

```typescript
// ❌ WRONG - Timezone conversion on date-only field
const displayDate = convertToUI(record.date, timezone, 'date');
// This can show the wrong date near midnight!

// ✅ CORRECT - Simple string formatting for date-only
const displayDate = formatDateString(record.date); // "03/15/2024"
```

### 3. Forgetting to Load with Timezone

**Problem**: Not converting UTC back to local when populating edit forms.

```typescript
// ❌ WRONG - Using UTC directly in form
setFormData({ date: event.start_date }); // This is UTC!

// ✅ CORRECT - Convert to local timezone first
setFormData({
  date: formatInTimeZone(new Date(event.start_date), timezone, 'yyyy-MM-dd')
});
```

### 4. Missing Timezone Check

**Problem**: Rendering before timezone is loaded.

```typescript
// ❌ WRONG - May use default timezone incorrectly
const { timezone } = useSchoolTimezone();
return <div>{convertToUI(date, timezone, 'time')}</div>;

// ✅ CORRECT - Wait for timezone to load
const { timezone, isLoading } = useSchoolTimezone();
if (isLoading) return <LoadingSpinner />;
return <div>{convertToUI(date, timezone, 'time')}</div>;
```

---

## Testing Checklist

### Setup Tests

- [ ] User's timezone is correctly stored in database
- [ ] `useSchoolTimezone` hook fetches correct timezone
- [ ] Default timezone fallback works when no timezone set

### Create Operations

- [ ] New records save times in UTC
- [ ] Times display correctly after creation
- [ ] All-day events save with noon time (DST-safe)

### Edit Operations

- [ ] Edit form loads with correct local time values
- [ ] Saving edited record maintains correct time (no drift)
- [ ] Edit → Save → Reload shows same time

### Display Operations

- [ ] List views show times in local timezone
- [ ] Detail views show times in local timezone
- [ ] Calendar/schedule views position events correctly

### Edge Cases

- [ ] DST transition dates display correctly
- [ ] Midnight events (00:00) display correctly
- [ ] Events created in different timezone display correctly
- [ ] Date-only fields don't shift dates

### Cross-Timezone Testing

Test with users in different timezones viewing the same data:
- [ ] New York user creates event at 2:00 PM EST
- [ ] Los Angeles user sees event at 11:00 AM PST
- [ ] Both save changes, times remain consistent

---

## Quick Reference

| Operation | Function | Example |
|-----------|----------|---------|
| Save to DB | `convertToUTC(date, time, tz)` | `convertToUTC('2024-03-15', '14:30', 'America/New_York')` |
| Display from DB | `convertToUI(utc, tz, mode)` | `convertToUI(event.start_date, timezone, 'datetime')` |
| Load into form | `formatInTimeZone(date, tz, format)` | `formatInTimeZone(new Date(utc), timezone, 'yyyy-MM-dd')` |
| Custom format | `formatInTimeZone(date, tz, format)` | `formatInTimeZone(utc, tz, 'EEEE, MMMM d')` |
| Compare dates | `isSameDayInSchoolTimezone(d1, d2, tz)` | `isSameDayInSchoolTimezone(event1.date, event2.date, tz)` |
| Get date key | `getSchoolDateKey(date, tz)` | `getSchoolDateKey(event.start_date, timezone)` |

---

## Migration Notes

If migrating from an older timezone implementation:

1. **date-fns-tz v2 → v3**: Rename `utcToZonedTime` → `toZonedTime` and `zonedTimeToUtc` → `fromZonedTime`
2. **Legacy functions**: Replace deprecated wrappers with direct `date-fns-tz` imports
3. **Verify stored data**: Ensure existing database timestamps are actually in UTC
4. **Test thoroughly**: Run the testing checklist above after migration
