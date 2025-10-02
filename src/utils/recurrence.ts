import { addDays, addWeeks, addMonths, isBefore, isAfter, format, startOfDay } from 'date-fns';
import { convertToUTC, convertToUI } from './timezoneUtils';

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;
  daysOfWeek?: number[]; // 1=Monday, 7=Sunday
  dayOfMonth?: number;
  endType: 'date' | 'count' | 'never';
  endDate?: string;
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
  // Default to UTC if no timezone provided (backward compatibility)
  const tz = timezone || 'UTC';
  // Calculate a reasonable max instances based on the recurrence rule
  if (!maxInstances) {
    if (recurrenceRule.endType === 'date' && recurrenceRule.endDate) {
      const startDate = new Date(baseEvent.start_date);
      const endDate = new Date(recurrenceRule.endDate);
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      switch (recurrenceRule.frequency) {
        case 'daily':
          maxInstances = Math.ceil(daysDiff / recurrenceRule.interval) + 100; // Generous buffer
          break;
        case 'weekly':
          // For weekly events, especially with specific days, we need more instances
          const weeksSpan = Math.ceil(daysDiff / 7);
          const possibleInstances = recurrenceRule.daysOfWeek?.length || 1;
          maxInstances = Math.ceil(weeksSpan * possibleInstances / recurrenceRule.interval) + 200; // Very generous buffer
          break;
        case 'monthly':
          maxInstances = Math.ceil(daysDiff / (30 * recurrenceRule.interval)) + 100; // Generous buffer
          break;
        default:
          maxInstances = 1000; // Large fallback
      }
    } else if (recurrenceRule.endType === 'count' && recurrenceRule.occurrenceCount) {
      maxInstances = recurrenceRule.occurrenceCount;
    } else {
      maxInstances = 100; // Default for 'never' ending events
    }
  }
  const instances: RecurringEventInstance[] = [];
  const startDate = new Date(baseEvent.start_date);
  const endDate = baseEvent.end_date ? new Date(baseEvent.end_date) : null;
  const eventDuration = endDate ? endDate.getTime() - startDate.getTime() : 0;
  
  let currentDate = new Date(startDate);
  let instanceCount = 0;
  
  // Skip the first occurrence since the original event already exists
  currentDate = calculateNextOccurrence(currentDate, recurrenceRule);
  
  while (instanceCount < maxInstances) {
    // Check end conditions
    if (recurrenceRule.endType === 'date' && recurrenceRule.endDate) {
      // Include events on the end date by comparing with start of next day
      const endDate = new Date(recurrenceRule.endDate);
      const nextDay = new Date(endDate);
      nextDay.setDate(nextDay.getDate() + 1);
      if (!isBefore(currentDate, nextDay)) break;
    }
    
    if (recurrenceRule.endType === 'count' && recurrenceRule.occurrenceCount) {
      // For count-based, we want total occurrences including the original
      if (instanceCount >= (recurrenceRule.occurrenceCount - 1)) break;
    }
    
    // For weekly frequency, check if current day is in daysOfWeek
    if (recurrenceRule.frequency === 'weekly' && recurrenceRule.daysOfWeek) {
      const dayOfWeek = currentDate.getDay() === 0 ? 7 : currentDate.getDay(); // Convert Sunday from 0 to 7
      if (!recurrenceRule.daysOfWeek.includes(dayOfWeek)) {
        currentDate = addDays(currentDate, 1);
        continue;
      }
    }
    
    // Create instance - convert to UTC for storage
    const instanceStartDate = new Date(currentDate);
    const instanceEndDate = endDate ? new Date(instanceStartDate.getTime() + eventDuration) : undefined;
    
    // Extract date and time components from the instance dates in school timezone
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
    
    // Calculate next occurrence
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
        // For weekly with specific days, increment by 1 day and let the main loop filter
        return addDays(currentDate, 1);
      } else {
        return addWeeks(currentDate, interval);
      }
    
    case 'monthly':
      const nextMonth = addMonths(currentDate, interval);
      
      // Handle month-end edge cases
      if (recurrenceRule.dayOfMonth) {
        const targetDay = recurrenceRule.dayOfMonth;
        const daysInMonth = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();
        const actualDay = Math.min(targetDay, daysInMonth);
        
        nextMonth.setDate(actualDay);
      }
      
      return nextMonth;
    
    default:
      return addDays(currentDate, 1);
  }
}

export function formatRecurrenceDescription(rule: RecurrenceRule): string {
  const { frequency, interval, daysOfWeek, endType, endDate, occurrenceCount } = rule;
  
  let description = '';
  
  // Frequency description
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
  
  // End condition description
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