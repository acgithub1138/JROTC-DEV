# Calendar Module Implementation Guide

A comprehensive guide to implement the full calendar functionality including recurring events, Google Maps address lookup, timezone handling, and event assignments.

---

## Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Dependencies](#dependencies)
4. [File Structure](#file-structure)
5. [Core Utilities](#core-utilities)
6. [Hooks](#hooks)
7. [Components](#components)
8. [Edge Functions](#edge-functions)
9. [Implementation Steps](#implementation-steps)

---

## Overview

This calendar system provides:
- **Event CRUD operations** with full timezone support
- **Recurring events** (daily, weekly, monthly) with flexible end conditions
- **Google Maps address lookup** with autocomplete
- **Event assignments** to teams or individuals (cadets)
- **Mobile-optimized iOS-style calendar view**
- **Multiple calendar views**: Month, Week, Day, List
- **Event types** with customizable colors

---

## Database Schema

### 1. Events Table

```sql
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id),
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  location TEXT,
  is_all_day BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Recurrence fields
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule JSONB,  -- Stores RecurrenceRule object
  recurrence_end_date TIMESTAMP WITH TIME ZONE,
  parent_event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  
  -- Event type reference
  event_type UUID REFERENCES public.event_types(id)
);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view events in their school" 
ON public.events FOR SELECT 
USING (school_id = (SELECT school_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create events in their school" 
ON public.events FOR INSERT 
WITH CHECK (school_id = (SELECT school_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update events in their school" 
ON public.events FOR UPDATE 
USING (school_id = (SELECT school_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete events in their school" 
ON public.events FOR DELETE 
USING (school_id = (SELECT school_id FROM public.profiles WHERE id = auth.uid()));

-- Index for performance
CREATE INDEX idx_events_school_start ON public.events(school_id, start_date);
CREATE INDEX idx_events_parent ON public.events(parent_event_id);
```

### 2. Event Types Table

```sql
CREATE TABLE public.event_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  value TEXT NOT NULL,           -- Unique identifier (e.g., 'meeting', 'training')
  label TEXT NOT NULL,           -- Display name (e.g., 'Meeting', 'Training')
  school_id UUID REFERENCES public.schools(id),  -- NULL for global defaults
  is_default BOOLEAN NOT NULL DEFAULT false,
  color TEXT,                    -- Hex color (e.g., '#3B82F6')
  "order" NUMERIC,               -- Sort order
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.event_types ENABLE ROW LEVEL SECURITY;

-- Allow users to see global types and their school's types
CREATE POLICY "Users can view event types" 
ON public.event_types FOR SELECT 
USING (school_id IS NULL OR school_id = (SELECT school_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create event types for their school" 
ON public.event_types FOR INSERT 
WITH CHECK (school_id = (SELECT school_id FROM public.profiles WHERE id = auth.uid()));

-- Insert default event types
INSERT INTO public.event_types (value, label, is_default, color, "order") VALUES
  ('event', 'Event', true, '#3B82F6', 1),
  ('meeting', 'Meeting', true, '#10B981', 2),
  ('training', 'Training', true, '#F59E0B', 3),
  ('competition', 'Competition', true, '#EF4444', 4),
  ('ceremony', 'Ceremony', true, '#8B5CF6', 5);
```

### 3. Event Assignments Table

```sql
-- Custom types
CREATE TYPE assignee_type AS ENUM ('team', 'cadet');
CREATE TYPE assignment_status AS ENUM ('assigned', 'confirmed', 'declined', 'completed');

CREATE TABLE public.event_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  assignee_type assignee_type NOT NULL,
  assignee_id UUID NOT NULL,        -- References teams.id or profiles.id
  role TEXT,                        -- Optional role description
  status assignment_status NOT NULL DEFAULT 'assigned',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.event_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view assignments for events in their school" 
ON public.event_assignments FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.events e 
    WHERE e.id = event_id 
    AND e.school_id = (SELECT school_id FROM public.profiles WHERE id = auth.uid())
  )
);

CREATE POLICY "Users can manage assignments" 
ON public.event_assignments FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.events e 
    WHERE e.id = event_id 
    AND e.school_id = (SELECT school_id FROM public.profiles WHERE id = auth.uid())
  )
);

CREATE INDEX idx_event_assignments_event ON public.event_assignments(event_id);
```

### 4. Schools Table (timezone field)

Ensure your schools table has a timezone column:

```sql
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/New_York';
```

---

## Dependencies

```bash
npm install date-fns date-fns-tz react-day-picker
```

Existing shadcn/ui components needed:
- Calendar
- Card
- Button
- Input
- Select
- Switch
- Checkbox
- Badge
- Dialog
- Popover
- Command (for address autocomplete)
- Label

---

## File Structure

```
src/
├── components/
│   └── calendar/
│       ├── CalendarManagementPage.tsx    # Main calendar page
│       ├── CalendarRecordPage.tsx        # Create/Edit event page
│       ├── components/
│       │   ├── AddressLookupField.tsx    # Google Maps autocomplete
│       │   ├── CalendarToolbar.tsx       # View switcher & filters
│       │   ├── CalendarView.tsx          # Main view container
│       │   ├── DayView.tsx               # Day view
│       │   ├── DeleteEventDialog.tsx     # Delete confirmation
│       │   ├── EventAssignmentSection.tsx # Team/Cadet assignments
│       │   ├── EventDetailsDialog.tsx    # Read-only event details
│       │   ├── EventDialog.tsx           # Dialog wrapper
│       │   ├── EventForm.tsx             # Event creation form
│       │   ├── ListView.tsx              # List view
│       │   ├── MobileCalendarView.tsx    # iOS-style mobile view
│       │   ├── MonthView.tsx             # Month grid view
│       │   ├── RecurrenceSettings.tsx    # Recurring event config
│       │   ├── RecurringDeleteDialog.tsx # Delete recurring options
│       │   └── WeekView.tsx              # Week view
│       └── hooks/
│           ├── useEvents.ts              # Event CRUD operations
│           └── useEventTypes.ts          # Event type management
├── hooks/
│   └── useSchoolTimezone.ts              # School timezone fetching
├── utils/
│   ├── recurrence.ts                     # Recurring event utilities
│   └── timezoneUtils.ts                  # Timezone conversion
└── supabase/
    └── functions/
        └── geocode-search/
            └── index.ts                  # Google Maps API edge function
```

---

## Core Utilities

### 1. Timezone Utilities (`src/utils/timezoneUtils.ts`)

```typescript
import { toZonedTime, fromZonedTime, formatInTimeZone } from 'date-fns-tz';

/**
 * Converts school-local date/time to UTC ISO string for database storage
 */
export const convertToUTC = (
  dateKey: string,           // "2024-03-15"
  timeHHmm: string,          // "14:30"
  timezone: string,          // "America/New_York"
  options?: { isAllDay?: boolean }
): string => {
  const time = options?.isAllDay ? '12:00' : timeHHmm;
  const [year, month, day] = dateKey.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  
  const schoolDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
  const utcDate = fromZonedTime(schoolDate, timezone);
  
  return utcDate.toISOString();
};

/**
 * Converts UTC timestamp to school timezone for UI display
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

export const COMMON_TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
];
```

### 2. Recurrence Utilities (`src/utils/recurrence.ts`)

```typescript
import { addDays, addWeeks, addMonths, isBefore, format } from 'date-fns';
import { convertToUTC, convertToUI } from './timezoneUtils';

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;           // Every X days/weeks/months
  daysOfWeek?: number[];      // 1=Monday, 7=Sunday (for weekly)
  dayOfMonth?: number;        // For monthly
  endType: 'date' | 'count' | 'never';
  endDate?: string;           // ISO string
  occurrenceCount?: number;
}

export interface RecurringEventInstance {
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  location?: string;
  event_type: string;
  is_all_day: boolean;
  school_id: string;
  created_by?: string;
  parent_event_id: string;
  is_recurring: boolean;
}

export function generateRecurringEvents(
  baseEvent: any,
  recurrenceRule: RecurrenceRule,
  maxInstances?: number,
  timezone?: string
): RecurringEventInstance[] {
  const tz = timezone || 'UTC';
  
  // Calculate max instances based on end condition
  if (!maxInstances) {
    if (recurrenceRule.endType === 'date' && recurrenceRule.endDate) {
      const startDate = new Date(baseEvent.start_date);
      const endDate = new Date(recurrenceRule.endDate);
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      switch (recurrenceRule.frequency) {
        case 'daily':
          maxInstances = Math.ceil(daysDiff / recurrenceRule.interval) + 100;
          break;
        case 'weekly':
          const weeksSpan = Math.ceil(daysDiff / 7);
          const possibleInstances = recurrenceRule.daysOfWeek?.length || 1;
          maxInstances = Math.ceil(weeksSpan * possibleInstances / recurrenceRule.interval) + 200;
          break;
        case 'monthly':
          maxInstances = Math.ceil(daysDiff / (30 * recurrenceRule.interval)) + 100;
          break;
        default:
          maxInstances = 1000;
      }
    } else if (recurrenceRule.endType === 'count' && recurrenceRule.occurrenceCount) {
      maxInstances = recurrenceRule.occurrenceCount;
    } else {
      maxInstances = 100; // Default for 'never' ending
    }
  }
  
  const instances: RecurringEventInstance[] = [];
  const startDate = new Date(baseEvent.start_date);
  const endDate = baseEvent.end_date ? new Date(baseEvent.end_date) : null;
  const eventDuration = endDate ? endDate.getTime() - startDate.getTime() : 0;
  
  let currentDate = new Date(startDate);
  let instanceCount = 0;
  
  // Skip first occurrence (original event exists)
  currentDate = calculateNextOccurrence(currentDate, recurrenceRule);
  
  while (instanceCount < maxInstances) {
    // Check end conditions
    if (recurrenceRule.endType === 'date' && recurrenceRule.endDate) {
      const endDate = new Date(recurrenceRule.endDate);
      const nextDay = new Date(endDate);
      nextDay.setDate(nextDay.getDate() + 1);
      if (!isBefore(currentDate, nextDay)) break;
    }
    
    if (recurrenceRule.endType === 'count' && recurrenceRule.occurrenceCount) {
      if (instanceCount >= (recurrenceRule.occurrenceCount - 1)) break;
    }
    
    // For weekly, check if current day is in daysOfWeek
    if (recurrenceRule.frequency === 'weekly' && recurrenceRule.daysOfWeek) {
      const dayOfWeek = currentDate.getDay() === 0 ? 7 : currentDate.getDay();
      if (!recurrenceRule.daysOfWeek.includes(dayOfWeek)) {
        currentDate = addDays(currentDate, 1);
        continue;
      }
    }
    
    // Create instance
    const instanceStartDate = new Date(currentDate);
    const instanceEndDate = endDate ? new Date(instanceStartDate.getTime() + eventDuration) : undefined;
    
    const startDateKey = convertToUI(instanceStartDate, tz, 'dateKey');
    const startTime = convertToUI(instanceStartDate, tz, 'time');
    
    instances.push({
      title: baseEvent.title,
      description: baseEvent.description,
      start_date: convertToUTC(startDateKey, startTime, tz, { isAllDay: baseEvent.is_all_day }),
      end_date: instanceEndDate ? (() => {
        const endDateKey = convertToUI(instanceEndDate, tz, 'dateKey');
        const endTime = convertToUI(instanceEndDate, tz, 'time');
        return convertToUTC(endDateKey, endTime, tz, { isAllDay: baseEvent.is_all_day });
      })() : undefined,
      location: baseEvent.location,
      event_type: baseEvent.event_type,
      is_all_day: baseEvent.is_all_day,
      school_id: baseEvent.school_id,
      created_by: baseEvent.created_by,
      parent_event_id: baseEvent.id,
      is_recurring: false
    });
    
    instanceCount++;
    currentDate = calculateNextOccurrence(currentDate, recurrenceRule);
  }
  
  return instances;
}

export function calculateNextOccurrence(currentDate: Date, recurrenceRule: RecurrenceRule): Date {
  const { frequency, interval } = recurrenceRule;
  
  switch (frequency) {
    case 'daily':
      return addDays(currentDate, interval);
    case 'weekly':
      if (recurrenceRule.daysOfWeek && recurrenceRule.daysOfWeek.length > 0) {
        return addDays(currentDate, 1); // Let main loop filter
      }
      return addWeeks(currentDate, interval);
    case 'monthly':
      const nextMonth = addMonths(currentDate, interval);
      if (recurrenceRule.dayOfMonth) {
        const daysInMonth = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();
        nextMonth.setDate(Math.min(recurrenceRule.dayOfMonth, daysInMonth));
      }
      return nextMonth;
    default:
      return addDays(currentDate, 1);
  }
}

export function formatRecurrenceDescription(rule: RecurrenceRule): string {
  const { frequency, interval, daysOfWeek, endType, endDate, occurrenceCount } = rule;
  
  let description = '';
  
  if (frequency === 'daily') {
    description = interval === 1 ? 'Daily' : `Every ${interval} days`;
  } else if (frequency === 'weekly') {
    if (daysOfWeek && daysOfWeek.length > 0) {
      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const selectedDays = daysOfWeek.map(day => dayNames[day - 1]).join(', ');
      description = interval === 1 
        ? `Weekly on ${selectedDays}`
        : `Every ${interval} weeks on ${selectedDays}`;
    } else {
      description = interval === 1 ? 'Weekly' : `Every ${interval} weeks`;
    }
  } else if (frequency === 'monthly') {
    description = interval === 1 ? 'Monthly' : `Every ${interval} months`;
  }
  
  if (endType === 'date' && endDate) {
    description += ` until ${format(new Date(endDate), 'MMM d, yyyy')}`;
  } else if (endType === 'count' && occurrenceCount) {
    description += ` for ${occurrenceCount} occurrences`;
  }
  
  return description;
}

export function validateRecurrenceRule(rule: RecurrenceRule): { isValid: boolean; error?: string } {
  if (!rule.frequency) {
    return { isValid: false, error: 'Frequency is required' };
  }
  if (!rule.interval || rule.interval < 1) {
    return { isValid: false, error: 'Interval must be at least 1' };
  }
  if (rule.frequency === 'weekly' && rule.daysOfWeek && rule.daysOfWeek.length === 0) {
    return { isValid: false, error: 'At least one day must be selected for weekly recurrence' };
  }
  if (rule.endType === 'date' && !rule.endDate) {
    return { isValid: false, error: 'End date is required when ending by date' };
  }
  if (rule.endType === 'count' && (!rule.occurrenceCount || rule.occurrenceCount < 1)) {
    return { isValid: false, error: 'Occurrence count must be at least 1' };
  }
  return { isValid: true };
}
```

---

## Hooks

### 1. useSchoolTimezone (`src/hooks/useSchoolTimezone.ts`)

```typescript
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useSchoolTimezone = () => {
  const [timezone, setTimezone] = useState<string>('America/New_York');
  const [isLoading, setIsLoading] = useState(true);
  const { userProfile } = useAuth();

  useEffect(() => {
    const fetchSchoolTimezone = async () => {
      if (!userProfile?.school_id) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('schools')
          .select('timezone')
          .eq('id', userProfile.school_id)
          .single();

        if (!error && data?.timezone) {
          setTimezone(data.timezone);
        }
      } catch (error) {
        console.error('Error fetching timezone:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchoolTimezone();
  }, [userProfile?.school_id]);

  return { timezone, isLoading };
};
```

### 2. useEvents Hook

See `src/components/calendar/hooks/useEvents.ts` for full implementation. Key features:
- Fetches events with event_types and event_assignments joined
- Enriches assignments with team/cadet names
- Creates recurring event instances automatically
- Handles deletion of single events or entire recurring series

### 3. useEventTypes Hook

See `src/components/calendar/hooks/useEventTypes.ts` for full implementation. Key features:
- Fetches both global and school-specific event types
- CRUD operations for event types
- Prevents deletion of global default types

---

## Edge Functions

### Geocode Search (`supabase/functions/geocode-search/index.ts`)

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json()
    
    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Query parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Geocoding service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const googleMapsUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&components=country:US&key=${apiKey}`
    
    const response = await fetch(googleMapsUrl)
    const googleData = await response.json()
    
    if (googleData.status !== 'OK') {
      return new Response(
        JSON.stringify([]),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Transform response with parsed address components
    const data = googleData.results.map((result: any) => {
      const addressComponents = result.address_components
      const getComponent = (type: string) => 
        addressComponents.find((c: any) => c.types.includes(type))?.long_name || ''
      const getShortComponent = (type: string) => 
        addressComponents.find((c: any) => c.types.includes(type))?.short_name || ''
      
      const streetNumber = getComponent('street_number')
      const route = getComponent('route')
      
      return {
        display_name: result.formatted_address,
        parsed_address: [streetNumber, route].filter(Boolean).join(' '),
        parsed_city: getComponent('locality') || getComponent('sublocality'),
        parsed_state: getShortComponent('administrative_area_level_1'),
        parsed_zip: getComponent('postal_code'),
        parsed_latitude: result.geometry.location.lat.toString(),
        parsed_longitude: result.geometry.location.lng.toString(),
      }
    })

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

**Required Secret**: Add `GOOGLE_MAPS_API_KEY` to your Supabase Edge Function secrets.

---

## Implementation Steps

### Step 1: Database Setup

1. Run the SQL migrations for `events`, `event_types`, and `event_assignments` tables
2. Add `timezone` column to your `schools` table
3. Insert default event types

### Step 2: Install Dependencies

```bash
npm install date-fns date-fns-tz react-day-picker
```

### Step 3: Create Utilities

1. Copy `timezoneUtils.ts` to `src/utils/`
2. Copy `recurrence.ts` to `src/utils/`

### Step 4: Create Hooks

1. Create `useSchoolTimezone.ts` in `src/hooks/`
2. Create `useEvents.ts` in calendar hooks folder
3. Create `useEventTypes.ts` in calendar hooks folder

### Step 5: Deploy Edge Function

1. Create `supabase/functions/geocode-search/index.ts`
2. Add `GOOGLE_MAPS_API_KEY` secret to Supabase
3. Deploy: `supabase functions deploy geocode-search`

### Step 6: Create Components

Copy components from `src/components/calendar/components/`:
- Start with `CalendarView.tsx` (main container)
- Add view components: `MonthView`, `WeekView`, `DayView`, `ListView`
- Add `MobileCalendarView.tsx` for mobile
- Add `EventForm.tsx` and `RecurrenceSettings.tsx`
- Add `AddressLookupField.tsx` for Google Maps
- Add `EventAssignmentSection.tsx` for assignments

### Step 7: Create Pages

1. `CalendarManagementPage.tsx` - Main calendar view
2. `CalendarRecordPage.tsx` - Create/Edit event form

### Step 8: Add Routes

```typescript
// In your router configuration
<Route path="/calendar" element={<CalendarManagementPage />} />
<Route path="/calendar/calendar_record" element={<CalendarRecordPage />} />
```

---

## Key Patterns

### Timezone Handling

**Always store in UTC, display in local timezone:**

```typescript
// Saving to database
const startDateUTC = convertToUTC(
  formData.start_date,           // "2024-03-15"
  `${formData.start_time_hour}:${formData.start_time_minute}`, // "14:30"
  timezone                        // "America/New_York"
);

// Loading from database
const displayDate = convertToUI(event.start_date, timezone, 'dateKey'); // "2024-03-15"
const displayTime = convertToUI(event.start_date, timezone, 'time');    // "14:30"
```

### Recurring Events

**Parent event creates child instances:**

```typescript
// When creating a recurring event
const { data } = await supabase.from('events').insert(eventData).select().single();

if (data.is_recurring && data.recurrence_rule) {
  const instances = generateRecurringEvents(data, data.recurrence_rule, undefined, timezone);
  await supabase.from('events').insert(instances);
}
```

**When updating, regenerate instances:**

```typescript
// Delete old instances
await supabase.from('events').delete().eq('parent_event_id', eventId);

// Generate new instances
const instances = generateRecurringEvents(updatedEvent, recurrenceRule, undefined, timezone);
await supabase.from('events').insert(instances);
```

### Delete Options for Recurring Events

- **Delete this event only**: Delete single instance
- **Delete entire series**: Delete parent AND all children with `parent_event_id`

```typescript
// Delete single
await supabase.from('events').delete().eq('id', eventId);

// Delete series
await supabase.from('events').delete().or(`id.eq.${parentId},parent_event_id.eq.${parentId}`);
```

---

## Event Interface

```typescript
export interface Event {
  id: string;
  title: string;
  description?: string;
  start_date: string;           // UTC ISO string
  end_date?: string;            // UTC ISO string
  location?: string;
  event_type?: string;          // UUID reference to event_types
  is_all_day: boolean;
  is_recurring?: boolean;
  recurrence_rule?: RecurrenceRule;
  recurrence_end_date?: string;
  parent_event_id?: string;     // For recurring instances
  school_id: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  
  // Joined data
  event_types?: {
    id: string;
    label: string;
    color?: string;
  };
  event_assignments?: Array<{
    id: string;
    assignee_type: 'team' | 'cadet';
    assignee_id: string;
    assignee_name?: string;
    role?: string;
    status: string;
  }>;
}
```

---

## Mobile Considerations

The `MobileCalendarView` component provides:
- iOS-style compact monthly calendar
- Dot indicators for days with events
- Swipe navigation between days
- Daily event list below calendar
- Optimized touch interactions

---

## Questions?

This implementation is battle-tested with:
- Full timezone support across US time zones
- Efficient recurring event generation
- Google Maps address autocomplete
- Team and individual assignments
- Multiple calendar views
- Mobile-optimized experience

Adapt the database schema, RLS policies, and component styling to match your project's needs.
