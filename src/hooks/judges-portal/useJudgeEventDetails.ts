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
}

export const useJudgeEventDetails = (eventId: string | undefined, competitionId: string | undefined) => {
  const { data: eventDetails, isLoading: isLoadingEvent, error: eventError } = useQuery({
    queryKey: ["judge-event-details", eventId],
    enabled: !!eventId,
    queryFn: async () => {
      // Get event details with joined event type name
      const { data: eventData, error: eventError } = await supabase
        .from("cp_comp_events")
        .select(`
          *,
          event_type:cp_events!cp_comp_events_event_fkey(id, name)
        `)
        .eq("id", eventId as string)
        .maybeSingle();

      if (eventError) throw eventError;
      if (!eventData) throw new Error('Event not found');

      const eventType = eventData.event_type as any;
      
      return {
        id: eventData.id,
        event_id: eventData.event || '',
        event_name: eventType?.name || 'Unknown Event',
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
    queryKey: ["judge-event-registered-schools", competitionId],
    enabled: !!competitionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cp_comp_schools")
        .select(`
          school_id,
          school_name
        `)
        .eq("competition_id", competitionId as string)
        .eq("status", "registered")
        .order("school_name", { ascending: true });

      if (error) throw error;
      
      return (data || []).map(school => ({
        school_id: school.school_id || '',
        school_name: school.school_name || 'Unknown School',
      })) as RegisteredSchool[];
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
