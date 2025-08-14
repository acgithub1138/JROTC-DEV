import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useDebouncedValue } from '@/hooks/useDebounce';

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
  timeSlots: TimeSlot[];
}

export const useCompetitionSchedule = (competitionId?: string) => {
  const [scheduleData, setScheduleData] = useState<ScheduleSlot[]>([]);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debouncedCompetitionId = useDebouncedValue(competitionId, 300);

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
          event:cp_events(name),
          start_time,
          end_time,
          interval,
          lunch_start_time,
          lunch_end_time
        `)
        .eq('competition_id', debouncedCompetitionId)
        .abortSignal(abortController.signal);

      if (eventsError) throw eventsError;

      // Fetch all schedule slots for this competition
      const { data: schedulesData, error: schedulesError } = await supabase
        .from('cp_event_schedules')
        .select('*')
        .eq('competition_id', debouncedCompetitionId)
        .abortSignal(abortController.signal);

      if (schedulesError) throw schedulesError;

      // Fetch school data including names and generate initials
      const { data: schoolsData, error: schoolsError } = await supabase
        .from('cp_comp_schools')
        .select('school_id, school_name, color')
        .eq('competition_id', debouncedCompetitionId)
        .abortSignal(abortController.signal);

      if (schoolsError) throw schoolsError;

      // Create school map with generated initials
      const schoolMap = new Map(
        schoolsData?.map(school => [
          school.school_id,
          {
            id: school.school_id,
            name: school.school_name || 'Unknown School',
            initials: school.school_name?.split(' ').map(word => word[0]).join('').toUpperCase() || '',
            color: school.color || '#3B82F6'
          }
        ]) || []
      );


      // Process events and generate time slots
      const processedEvents: ScheduleEvent[] = eventsData?.map(event => {
        const startTime = new Date(event.start_time);
        const endTime = new Date(event.end_time);
        const interval = event.interval || 15; // Default to 15 minutes

        const timeSlots: TimeSlot[] = [];
        const current = new Date(startTime);

        while (current < endTime) {
          // Check if this is lunch time
          const isLunchTime = event.lunch_start_time && event.lunch_end_time && 
            current >= new Date(event.lunch_start_time) && 
            current < new Date(event.lunch_end_time);

          if (isLunchTime) {
            // Add lunch break slot
            timeSlots.push({
              time: new Date(current),
              duration: interval,
              isLunchBreak: true
            });
          } else {
            // Add regular time slot
            const scheduleForSlot = schedulesData?.find(
              s => s.event_id === event.id && 
                   new Date(s.scheduled_time).getTime() === current.getTime()
            );

            const schoolInfo = scheduleForSlot ? schoolMap.get(scheduleForSlot.school_id) : undefined;

            timeSlots.push({
              time: new Date(current),
              duration: interval,
              isLunchBreak: false,
              assignedSchool: scheduleForSlot && schoolInfo ? {
                id: scheduleForSlot.school_id,
                name: schoolInfo.name,
                initials: schoolInfo.initials,
                color: schoolInfo.color
              } : undefined
            });
          }

          current.setMinutes(current.getMinutes() + interval);
        }

        return {
          id: event.id,
          event_name: event.event?.name || 'Unknown Event',
          event_location: event.location,
          start_time: event.start_time,
          end_time: event.end_time,
          interval,
          timeSlots
        };
      }) || [];

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
  }, [debouncedCompetitionId]);

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
          schools(name)
        `)
        .eq('competition_id', debouncedCompetitionId)
        .in('school_id', registeredSchools.map(r => r.school_id));

      // If no school names found in cp_comp_schools, get them directly from schools table
      let finalSchoolNames = schoolNames;
      if (!schoolNames?.length) {
        const { data: directSchoolNames, error: directSchoolError } = await supabase
          .from('schools')
          .select('id, name')
          .in('id', registeredSchools.map(r => r.school_id));
        
        if (!directSchoolError && directSchoolNames) {
          finalSchoolNames = directSchoolNames.map(school => ({
            school_id: school.id,
            school_name: school.name,
            schools: { name: school.name }
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
          initials: schoolName.split(' ').map(word => word[0]).join('').toUpperCase()
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
    scheduleData,
    isLoading,
    updateScheduleSlot,
    getAvailableSchools,
    refetch: fetchScheduleData
  };
};