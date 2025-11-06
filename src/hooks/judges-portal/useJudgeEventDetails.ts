import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EventDetails {
  id: string;
  event_id: string;
  event_name: string;
  event_start_time: string | null;
  event_end_time: string | null;
  event_location: string | null;
  competition_id: string;
  score_sheet: string | null;
}

export interface RegisteredSchool {
  school_id: string;
  school_name: string;
  scheduled_time?: string | null;
}

export const useJudgeEventDetails = (eventId: string | undefined, competitionId: string | undefined) => {
  const { data: eventDetails, isLoading: isLoadingEvent, error: eventError } = useQuery({
    queryKey: ["judge-event-details", eventId],
    enabled: !!eventId,
    queryFn: async () => {
      // First get the event details
      const { data: eventData, error: eventError } = await supabase
        .from("cp_comp_events")
        .select("*")
        .eq("id", eventId as string)
        .single();

      if (eventError) throw eventError;

      // Then get the event type name
      let eventName = 'Unknown Event';
      if (eventData.event) {
        const { data: eventType } = await supabase
          .from("competition_event_types")
          .select("name")
          .eq("id", eventData.event)
          .maybeSingle();
        
        if (eventType) {
          eventName = eventType.name;
        }
      }
      
      return {
        id: eventData.id,
        event_id: eventData.event || '',
        event_name: eventName,
        event_start_time: eventData.start_time,
        event_end_time: eventData.end_time,
        event_location: eventData.location,
        competition_id: eventData.competition_id,
        score_sheet: eventData.score_sheet,
      } as EventDetails;
    },
    staleTime: 0,
    refetchOnMount: true,
  });

  const { data: registeredSchools = [], isLoading: isLoadingSchools, error: schoolsError } = useQuery({
    queryKey: ["judge-event-registered-schools", competitionId, eventId],
    enabled: !!competitionId && !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cp_comp_schools")
        .select(`
          school_id,
          school_name
        `)
        .eq("competition_id", competitionId as string)
        .eq("status", "registered");

      if (error) throw error;
      
      // Fetch schedule data for these schools
      const { data: scheduleData } = await supabase
        .from("cp_event_schedules")
        .select("school_id, scheduled_time")
        .eq("competition_id", competitionId as string)
        .eq("event_id", eventId as string);

      // Create a map of school_id to scheduled_time
      const scheduleMap = new Map(
        scheduleData?.map(s => [s.school_id, s.scheduled_time]) || []
      );
      
      // Combine school data with schedule times and sort by scheduled_time
      const schoolsWithSchedule = (data || []).map(school => ({
        school_id: school.school_id || '',
        school_name: school.school_name || 'Unknown School',
        scheduled_time: scheduleMap.get(school.school_id || '') || null,
      })) as RegisteredSchool[];

      // Sort by scheduled_time (nulls last), then by name
      return schoolsWithSchedule.sort((a, b) => {
        if (!a.scheduled_time && !b.scheduled_time) {
          return a.school_name.localeCompare(b.school_name);
        }
        if (!a.scheduled_time) return 1;
        if (!b.scheduled_time) return -1;
        return new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime();
      });
    },
    staleTime: 0,
    refetchOnMount: true,
  });

  return {
    eventDetails,
    registeredSchools,
    isLoading: isLoadingEvent || isLoadingSchools,
    error: eventError || schoolsError,
  };
};
