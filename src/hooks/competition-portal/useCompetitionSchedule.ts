import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  assignedSchool?: {
    id: string;
    name: string;
    color?: string;
  };
}

export interface ScheduleEvent {
  id: string;
  event_name: string;
  start_time: string;
  end_time: string;
  interval: number;
  timeSlots: TimeSlot[];
}

export const useCompetitionSchedule = (competitionId?: string) => {
  const [scheduleData, setScheduleData] = useState<ScheduleSlot[]>([]);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchScheduleData = async () => {
    if (!competitionId) return;

    try {
      setIsLoading(true);

      // Fetch events with their schedules
      const { data: eventsData, error: eventsError } = await supabase
        .from('cp_comp_events')
        .select(`
          id,
          event:cp_events(name),
          start_time,
          end_time,
          interval
        `)
        .eq('competition_id', competitionId);

      if (eventsError) throw eventsError;

      // Fetch all schedule slots for this competition
      const { data: schedulesData, error: schedulesError } = await supabase
        .from('cp_event_schedules')
        .select('*')
        .eq('competition_id', competitionId);

      if (schedulesError) throw schedulesError;

      // Fetch school colors for this competition
      const { data: schoolsData, error: schoolsError } = await supabase
        .from('cp_comp_schools')
        .select('school_id, color')
        .eq('competition_id', competitionId);

      if (schoolsError) throw schoolsError;


      // Process events and generate time slots
      const processedEvents: ScheduleEvent[] = eventsData?.map(event => {
        const startTime = new Date(event.start_time);
        const endTime = new Date(event.end_time);
        const interval = event.interval || 15; // Default to 15 minutes

        const timeSlots: TimeSlot[] = [];
        const current = new Date(startTime);

        while (current < endTime) {
          const scheduleForSlot = schedulesData?.find(
            s => s.event_id === event.id && 
                 new Date(s.scheduled_time).getTime() === current.getTime()
          );

          const schoolColor = scheduleForSlot ? 
            schoolsData?.find(school => school.school_id === scheduleForSlot.school_id)?.color : 
            undefined;

          timeSlots.push({
            time: new Date(current),
            duration: interval,
            assignedSchool: scheduleForSlot ? {
              id: scheduleForSlot.school_id,
              name: scheduleForSlot.school_name || 'Unknown School',
              color: schoolColor
            } : undefined
          });

          current.setMinutes(current.getMinutes() + interval);
        }

        return {
          id: event.id,
          event_name: event.event?.name || 'Unknown Event',
          start_time: event.start_time,
          end_time: event.end_time,
          interval,
          timeSlots
        };
      }) || [];

      setEvents(processedEvents);
      setScheduleData(schedulesData || []);
    } catch (error) {
      console.error('Error fetching schedule data:', error);
      toast.error('Failed to load schedule data');
    } finally {
      setIsLoading(false);
    }
  };

  const updateScheduleSlot = async (eventId: string, timeSlot: Date, schoolId: string | null) => {
    if (!competitionId) return;

    try {
      if (schoolId) {
        // Add/update assignment
        const { error } = await supabase
          .from('cp_event_schedules')
          .upsert({
            competition_id: competitionId,
            event_id: eventId,
            school_id: schoolId,
            scheduled_time: timeSlot.toISOString(),
            duration: events.find(e => e.id === eventId)?.interval || 15
          });

        if (error) throw error;
      } else {
        // Remove assignment
        const { error } = await supabase
          .from('cp_event_schedules')
          .delete()
          .eq('competition_id', competitionId)
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

  const getAvailableSchools = async (eventId: string) => {
    if (!competitionId) return [];

    try {
      // Get schools registered for this event
      const { data: registeredSchools, error: regError } = await supabase
        .from('cp_event_registrations')
        .select(`
          school_id
        `)
        .eq('competition_id', competitionId)
        .eq('event_id', eventId)
        .eq('status', 'registered');

      if (regError) throw regError;

      // Get schools already scheduled for this event
      const { data: scheduledSchools, error: schedError } = await supabase
        .from('cp_event_schedules')
        .select('school_id')
        .eq('competition_id', competitionId)
        .eq('event_id', eventId);

      if (schedError) throw schedError;

      const scheduledSchoolIds = new Set(scheduledSchools?.map(s => s.school_id) || []);

      // Get school names for registered schools
      if (!registeredSchools?.length) return [];

      const { data: schoolNames, error: schoolError } = await supabase
        .from('cp_comp_schools')
        .select(`
          school_id,
          school_name,
          schools(name)
        `)
        .eq('competition_id', competitionId)
        .in('school_id', registeredSchools.map(r => r.school_id));

      if (schoolError) throw schoolError;

      // Return available schools (registered but not yet scheduled)
      return registeredSchools?.filter(
        school => !scheduledSchoolIds.has(school.school_id)
      ).map(school => {
        const schoolInfo = schoolNames?.find(s => s.school_id === school.school_id);
        return {
          id: school.school_id,
          name: schoolInfo?.schools?.name || schoolInfo?.school_name || 'Unknown School'
        };
      }) || [];
    } catch (error) {
      console.error('Error fetching available schools:', error);
      return [];
    }
  };

  useEffect(() => {
    if (competitionId) {
      fetchScheduleData();
    }
  }, [competitionId]);

  return {
    events,
    scheduleData,
    isLoading,
    updateScheduleSlot,
    getAvailableSchools,
    refetch: fetchScheduleData
  };
};