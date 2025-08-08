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
  isLunchBreak?: boolean;
  assignedSchool?: {
    id: string;
    name: string;
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

  const fetchScheduleData = async () => {
    if (!competitionId) return;

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

            const schoolColor = scheduleForSlot ? 
              schoolsData?.find(school => school.school_id === scheduleForSlot.school_id)?.color : 
              undefined;

            timeSlots.push({
              time: new Date(current),
              duration: interval,
              isLunchBreak: false,
              assignedSchool: scheduleForSlot ? {
                id: scheduleForSlot.school_id,
                name: scheduleForSlot.school_name || 'Unknown School',
                color: schoolColor
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

  const getAvailableSchools = async (eventId: string, localScheduleOverrides?: Record<string, string | null>) => {
    if (!competitionId) return [];

    try {
      console.log('ACTEST getAvailableSchools - START:', { eventId, competitionId, localScheduleOverrides });

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

      console.log('ACTEST getAvailableSchools - registeredSchools:', registeredSchools);

      // Get schools already scheduled for this event
      const { data: scheduledSchools, error: schedError } = await supabase
        .from('cp_event_schedules')
        .select('school_id')
        .eq('competition_id', competitionId)
        .eq('event_id', eventId);

      if (schedError) throw schedError;

      console.log('ACTEST getAvailableSchools - scheduledSchools:', scheduledSchools);

      // Start with database scheduled schools
      const scheduledSchoolIds = new Set(scheduledSchools?.map(s => s.school_id) || []);
      
      // Apply local schedule overrides if provided
      if (localScheduleOverrides !== undefined) {
        console.log('ACTEST getAvailableSchools - applying local overrides:', localScheduleOverrides);
        // Clear database scheduled schools and use only local schedule
        scheduledSchoolIds.clear();
        Object.values(localScheduleOverrides).forEach(schoolId => {
          if (schoolId) {
            scheduledSchoolIds.add(schoolId);
          }
        });
        console.log('ACTEST getAvailableSchools - final scheduledSchoolIds after overrides:', Array.from(scheduledSchoolIds));
      }

      // Get school names for registered schools
      if (!registeredSchools?.length) {
        console.log('ACTEST getAvailableSchools - NO registered schools, returning empty array');
        return [];
      }

      console.log('ACTEST getAvailableSchools - fetching school names for:', registeredSchools.map(r => r.school_id));

      // Try to get school names from cp_comp_schools first
      const { data: schoolNames, error: schoolError } = await supabase
        .from('cp_comp_schools')
        .select(`
          school_id,
          school_name,
          schools(name)
        `)
        .eq('competition_id', competitionId)
        .in('school_id', registeredSchools.map(r => r.school_id));

      console.log('ACTEST getAvailableSchools - cp_comp_schools result:', { schoolNames, schoolError });

      // If no school names found in cp_comp_schools, get them directly from schools table
      let finalSchoolNames = schoolNames;
      if (!schoolNames?.length) {
        console.log('ACTEST getAvailableSchools - no schools in cp_comp_schools, trying schools table directly');
        const { data: directSchoolNames, error: directSchoolError } = await supabase
          .from('schools')
          .select('id, name')
          .in('id', registeredSchools.map(r => r.school_id));
        
        console.log('ACTEST getAvailableSchools - direct schools result:', { directSchoolNames, directSchoolError });
        
        if (!directSchoolError && directSchoolNames) {
          finalSchoolNames = directSchoolNames.map(school => ({
            school_id: school.id,
            school_name: school.name,
            schools: { name: school.name }
          }));
        }
      }

      if (schoolError && !finalSchoolNames?.length) throw schoolError;

      console.log('ACTEST getAvailableSchools - finalSchoolNames:', finalSchoolNames);

      // Return available schools (registered but not yet scheduled)
      const result = registeredSchools?.filter(
        school => !scheduledSchoolIds.has(school.school_id)
      ).map(school => {
        const schoolInfo = finalSchoolNames?.find(s => s.school_id === school.school_id);
        return {
          id: school.school_id,
          name: schoolInfo?.schools?.name || schoolInfo?.school_name || 'Unknown School'
        };
      }) || [];

      console.log('ACTEST getAvailableSchools - FINAL RESULT:', result);
      return result;
    } catch (error) {
      console.error('ACTEST getAvailableSchools - ERROR:', error);
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