import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useDebouncedValue } from '@/hooks/useDebounce';
import { convertToSchoolTimezone } from '@/utils/timezoneUtils';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';

export interface ScheduleSlot {
  id: string;
  competition_id: string;
  event_id: string;
  school_id: string;
  school_name?: string;
  scheduled_time: string;
  duration: number;
}

export interface TimeSlot {
  time: Date;
  duration: number;
  isLunchBreak?: boolean;
  assignedSchool?: {
    id: string;
    name: string;
    initials?: string;
    color?: string;
  };
}

export interface ScheduleEvent {
  id: string;
  event_name: string;
  event_location?: string;
  start_time: string;
  end_time: string;
  interval: number;
  lunch_start_time?: string;
  lunch_end_time?: string;
}

export interface CompetitionTimeline {
  timeSlots: Date[];
  interval: number;
  getAssignedSchool: (eventId: string, timeSlot: Date) => TimeSlot['assignedSchool'];
  isEventActive: (eventId: string, timeSlot: Date) => boolean;
  isLunchBreak: (eventId: string, timeSlot: Date) => boolean;
}

export const useCompetitionSchedule = (competitionId?: string) => {
  const [scheduleData, setScheduleData] = useState<ScheduleSlot[]>([]);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [timeline, setTimeline] = useState<CompetitionTimeline | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debouncedCompetitionId = useDebouncedValue(competitionId, 300);
  const { timezone } = useSchoolTimezone();

  const fetchScheduleData = useCallback(async () => {
    if (!debouncedCompetitionId) return;

    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      setIsLoading(true);

      // Fetch events with their schedules
      const { data: eventsData, error: eventsError } = await supabase
        .from('cp_comp_events')
        .select(`
          id,
          location,
          event,
          start_time,
          end_time,
          interval,
          lunch_start_time,
          lunch_end_time
        `)
        .eq('competition_id', debouncedCompetitionId)
        .abortSignal(abortController.signal);

      if (eventsError) throw eventsError;

      // Fetch event types separately
      const eventIds = eventsData?.map(e => e.event).filter(Boolean) || [];
      const { data: eventTypesData, error: eventTypesError } = await supabase
        .from('competition_event_types')
        .select('id, name')
        .in('id', eventIds)
        .abortSignal(abortController.signal);

      if (eventTypesError) throw eventTypesError;

      // Create event types map
      const eventTypesMap = new Map(
        eventTypesData?.map(et => [et.id, et.name]) || []
      );

      // Fetch all schedule slots for this competition
      const { data: schedulesData, error: schedulesError } = await supabase
        .from('cp_event_schedules')
        .select('*')
        .eq('competition_id', debouncedCompetitionId)
        .abortSignal(abortController.signal);

      if (schedulesError) throw schedulesError;

      // Fetch school data including names and initials from schools table
      const { data: schoolsData, error: schoolsError } = await supabase
        .from('cp_comp_schools')
        .select(`
          school_id, 
          school_name, 
          school_initials, 
          color,
          schools(initials)
        `)
        .eq('competition_id', debouncedCompetitionId)
        .abortSignal(abortController.signal);

      if (schoolsError) throw schoolsError;

      // Create school map using initials from schools table
      const schoolMap = new Map(
        schoolsData?.map(school => [
          school.school_id,
          {
            id: school.school_id,
            name: school.school_name || 'Unknown School',
            initials: school.schools?.initials || school.school_initials || '',
            color: school.color || '#3B82F6'
          }
        ]) || []
      );


      // Process events without individual time slots
      const processedEvents: ScheduleEvent[] = eventsData?.map(event => ({
        id: event.id,
        event_name: eventTypesMap.get(event.event) || 'Unknown Event',
        event_location: event.location,
        start_time: event.start_time,
        end_time: event.end_time,
        interval: event.interval || 15,
        lunch_start_time: event.lunch_start_time,
        lunch_end_time: event.lunch_end_time
      })) || [];

      // Generate unified competition timeline
      if (processedEvents.length > 0) {
        // Find competition-wide time boundaries
        const startTimes = processedEvents.map(e => convertToSchoolTimezone(e.start_time, timezone));
        const endTimes = processedEvents.map(e => convertToSchoolTimezone(e.end_time, timezone));
        const intervals = processedEvents.map(e => e.interval);
        
        const competitionStart = new Date(Math.min(...startTimes.map(t => t.getTime())));
        const competitionEnd = new Date(Math.max(...endTimes.map(t => t.getTime())));
        const minInterval = Math.min(...intervals);
        
        // Generate unified time slots
        const unifiedTimeSlots: Date[] = [];
        const current = new Date(competitionStart);
        
        while (current < competitionEnd) {
          unifiedTimeSlots.push(new Date(current));
          current.setMinutes(current.getMinutes() + minInterval);
        }
        
        // Create timeline with helper functions
        const competitionTimeline: CompetitionTimeline = {
          timeSlots: unifiedTimeSlots,
          interval: minInterval,
          
          getAssignedSchool: (eventId: string, timeSlot: Date) => {
            const scheduleForSlot = schedulesData?.find(
              s => s.event_id === eventId && 
                   Math.abs(convertToSchoolTimezone(s.scheduled_time, timezone).getTime() - timeSlot.getTime()) < 1000
            );
            const schoolInfo = scheduleForSlot ? schoolMap.get(scheduleForSlot.school_id) : undefined;
            
            return scheduleForSlot && schoolInfo ? {
              id: scheduleForSlot.school_id,
              name: schoolInfo.name,
              initials: schoolInfo.initials,
              color: schoolInfo.color
            } : undefined;
          },
          
          isEventActive: (eventId: string, timeSlot: Date) => {
            const event = processedEvents.find(e => e.id === eventId);
            if (!event) return false;
            
            const eventStart = convertToSchoolTimezone(event.start_time, timezone);
            const eventEnd = convertToSchoolTimezone(event.end_time, timezone);
            return timeSlot >= eventStart && timeSlot < eventEnd;
          },
          
          isLunchBreak: (eventId: string, timeSlot: Date) => {
            const event = processedEvents.find(e => e.id === eventId);
            if (!event || !event.lunch_start_time || !event.lunch_end_time) return false;
            
            const lunchStart = convertToSchoolTimezone(event.lunch_start_time, timezone);
            const lunchEnd = convertToSchoolTimezone(event.lunch_end_time, timezone);
            return timeSlot >= lunchStart && timeSlot < lunchEnd;
          }
        };
        
        setTimeline(competitionTimeline);
      }

      setEvents(processedEvents);
      setScheduleData(schedulesData || []);
    } catch (error: any) {
      // Don't show errors if request was aborted
      if (error?.code !== 'AbortError' && error?.name !== 'AbortError') {
        console.error('Error fetching schedule data:', error);
        toast.error('Failed to load schedule data');
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [debouncedCompetitionId, timezone]);

  const updateScheduleSlot = async (eventId: string, timeSlot: Date, schoolId: string | null) => {
    if (!debouncedCompetitionId) return;

    try {
      if (schoolId) {
        // If this school already has a record for this event, update its time; otherwise create it
        const { data: existing, error: existingErr } = await supabase
          .from('cp_event_schedules')
          .select('id')
          .eq('competition_id', debouncedCompetitionId)
          .eq('event_id', eventId)
          .eq('school_id', schoolId)
          .maybeSingle();

        if (existingErr) throw existingErr;

        if (existing?.id) {
          const { error: updErr } = await supabase
            .from('cp_event_schedules')
            .update({
              scheduled_time: timeSlot.toISOString(),
              duration: events.find(e => e.id === eventId)?.interval || 15,
            })
            .eq('id', existing.id);
          if (updErr) throw updErr;
        } else {
          const { error: insErr } = await supabase
            .from('cp_event_schedules')
            .insert({
              competition_id: debouncedCompetitionId,
              event_id: eventId,
              school_id: schoolId,
              scheduled_time: timeSlot.toISOString(),
              duration: events.find(e => e.id === eventId)?.interval || 15,
            });
          if (insErr) throw insErr;
        }
      } else {
        // Remove assignment by old time slot for this event
        const { error } = await supabase
          .from('cp_event_schedules')
          .delete()
          .eq('competition_id', debouncedCompetitionId)
          .eq('event_id', eventId)
          .eq('scheduled_time', timeSlot.toISOString());
        if (error) throw error;
      }

      // No internal data refresh or toast - let parent handle this
    } catch (error) {
      console.error('Error updating schedule:', error);
      throw error; // Re-throw so modal can handle error
    }
  };

  const getAvailableSchools = useCallback(async (eventId: string, localScheduleOverrides?: Record<string, string | null>) => {
    if (!debouncedCompetitionId) return [];

    try {
      // Get schools registered for this event
      const { data: registeredSchools, error: regError } = await supabase
        .from('cp_event_registrations')
        .select('school_id')
        .eq('competition_id', debouncedCompetitionId)
        .eq('event_id', eventId)
        .eq('status', 'registered');

      if (regError) throw regError;

      // Get schools already scheduled for this event
      const { data: scheduledSchools, error: schedError } = await supabase
        .from('cp_event_schedules')
        .select('school_id')
        .eq('competition_id', debouncedCompetitionId)
        .eq('event_id', eventId);

      if (schedError) throw schedError;

      // Start with database scheduled schools
      const scheduledSchoolIds = new Set(scheduledSchools?.map(s => s.school_id) || []);
      
      // Apply local schedule overrides if provided
      if (localScheduleOverrides !== undefined) {
        // Clear database scheduled schools and use only local schedule
        scheduledSchoolIds.clear();
        Object.values(localScheduleOverrides).forEach(schoolId => {
          if (schoolId) {
            scheduledSchoolIds.add(schoolId);
          }
        });
      }

      // Get school names for registered schools
      if (!registeredSchools?.length) {
        return [];
      }

      // Try to get school names from cp_comp_schools first
      const { data: schoolNames, error: schoolError } = await supabase
        .from('cp_comp_schools')
        .select(`
          school_id,
          school_name,
          school_initials,
          schools(name, initials)
        `)
        .eq('competition_id', debouncedCompetitionId)
        .in('school_id', registeredSchools.map(r => r.school_id));

      // If no school names found in cp_comp_schools, get them directly from schools table
      let finalSchoolNames = schoolNames;
      if (!schoolNames?.length) {
        const { data: directSchoolNames, error: directSchoolError } = await supabase
          .from('schools')
          .select('id, name, initials')
          .in('id', registeredSchools.map(r => r.school_id));
        
        if (!directSchoolError && directSchoolNames) {
          finalSchoolNames = directSchoolNames.map(school => ({
            school_id: school.id,
            school_name: school.name,
            school_initials: null,
            schools: { name: school.name, initials: school.initials }
          }));
        }
      }

      if (schoolError && !finalSchoolNames?.length) throw schoolError;

      // Return available schools (registered but not yet scheduled)
      const result = registeredSchools?.filter(
        school => !scheduledSchoolIds.has(school.school_id)
      ).map(school => {
        const schoolInfo = finalSchoolNames?.find(s => s.school_id === school.school_id);
        const schoolName = schoolInfo?.schools?.name || schoolInfo?.school_name || 'Unknown School';
        return {
          id: school.school_id,
          name: schoolName,
          initials: schoolInfo?.schools?.initials || schoolInfo?.school_initials || ''
        };
      }) || [];

      return result;
    } catch (error) {
      console.error('Error getting available schools:', error);
      return [];
    }
  }, [debouncedCompetitionId]);

  useEffect(() => {
    if (debouncedCompetitionId) {
      fetchScheduleData();
    }
    
    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedCompetitionId, fetchScheduleData]);

  return {
    events,
    timeline,
    scheduleData,
    isLoading,
    updateScheduleSlot,
    getAvailableSchools,
    refetch: fetchScheduleData
  };
};