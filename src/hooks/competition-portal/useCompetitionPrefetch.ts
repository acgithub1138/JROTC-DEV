import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Competition Portal Prefetching Hook
 * Prefetches data for predictable navigation patterns to improve perceived performance
 */
export const useCompetitionPrefetch = () => {
  const queryClient = useQueryClient();
  const { userProfile } = useAuth();

  /**
   * Prefetch competition details when hovering over competition card
   */
  const prefetchCompetitionDetails = async (competitionId: string) => {
    if (!userProfile?.school_id) return;

    await queryClient.prefetchQuery({
      queryKey: ['cp-competition', competitionId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('cp_competitions')
          .select('*')
          .eq('id', competitionId)
          .single();

        if (error) throw error;
        return data;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  /**
   * Prefetch competition events when entering competition details
   */
  const prefetchCompetitionEvents = async (competitionId: string) => {
    if (!userProfile?.school_id) return;

    await queryClient.prefetchQuery({
      queryKey: ['competition-events', competitionId, userProfile.school_id],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('cp_comp_events_detailed')
          .select('*')
          .eq('competition_id', competitionId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
      },
      staleTime: 2 * 60 * 1000,
    });
  };

  /**
   * Prefetch event registrations for a competition
   */
  const prefetchEventRegistrations = async (competitionId: string) => {
    if (!userProfile?.school_id) return;

    await queryClient.prefetchQuery({
      queryKey: ['event-registrations', competitionId, userProfile.school_id],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('cp_event_registrations')
          .select('*')
          .eq('competition_id', competitionId)
          .eq('school_id', userProfile.school_id);

        if (error) throw error;
        return data || [];
      },
      staleTime: 2 * 60 * 1000,
    });
  };

  /**
   * Prefetch judges for competition management
   */
  const prefetchJudges = async () => {
    if (!userProfile?.school_id) return;

    await queryClient.prefetchQuery({
      queryKey: ['cp-judges', userProfile.school_id],
      queryFn: async () => {
        // @ts-expect-error - Type inference issue with new columns until Supabase types regenerate
        const result: any = await supabase
          .from('cp_judges')
          .select('*')
          .eq('school_id', userProfile.school_id)
          .order('name', { ascending: true });

        if (result.error) throw result.error;
        return result.data || [];
      },
      staleTime: 10 * 60 * 1000,
    });
  };

  /**
   * Prefetch registered schools for a competition
   */
  const prefetchRegisteredSchools = async (competitionId: string) => {
    await queryClient.prefetchQuery({
      queryKey: ['cp-comp-schools', competitionId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('cp_comp_schools')
          .select('*')
          .eq('competition_id', competitionId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
      },
      staleTime: 2 * 60 * 1000,
    });
  };

  /**
   * Prefetch competition schedule data
   */
  const prefetchCompetitionSchedule = async (competitionId: string) => {
    await queryClient.prefetchQuery({
      queryKey: ['competition-schedule', competitionId],
      queryFn: async () => {
        const [eventsResult, schedulesResult, schoolsResult] = await Promise.all([
          supabase
            .from('cp_comp_events')
            .select('id, location, event, start_time, end_time, interval, lunch_start_time, lunch_end_time')
            .eq('competition_id', competitionId),
          supabase
            .from('cp_event_schedules')
            .select('*')
            .eq('competition_id', competitionId),
          supabase
            .from('cp_comp_schools')
            .select('school_id, school_name, school_initials, color, schools(initials)')
            .eq('competition_id', competitionId)
        ]);

        return { eventsResult, schedulesResult, schoolsResult };
      },
      staleTime: 2 * 60 * 1000,
    });
  };

  /**
   * Prefetch judge schedule data
   */
  const prefetchJudgeSchedule = async (competitionId: string) => {
    await queryClient.prefetchQuery({
      queryKey: ['judge-schedule', competitionId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('cp_comp_judges')
          .select(`
            id, judge, event, location, start_time, end_time,
            cp_judges!inner(name),
            cp_comp_events!inner(id, event, interval, competition_event_types!inner(name, initials))
          `)
          .eq('competition_id', competitionId);

        if (error) throw error;
        return data || [];
      },
      staleTime: 2 * 60 * 1000,
    });
  };

  /**
   * Prefetch resource schedule data
   */
  const prefetchResourceSchedule = async (competitionId: string) => {
    await queryClient.prefetchQuery({
      queryKey: ['resource-schedule', competitionId],
      queryFn: async () => {
        const [resourceResult, eventsResult] = await Promise.all([
          supabase
            .from('cp_comp_resources')
            .select('id, resource, location, start_time, end_time, assignment_details, profiles!inner(first_name, last_name)')
            .eq('competition_id', competitionId),
          supabase
            .from('cp_comp_events')
            .select('start_time, end_time, interval')
            .eq('competition_id', competitionId)
        ]);

        return { resourceResult, eventsResult };
      },
      staleTime: 2 * 60 * 1000,
    });
  };

  /**
   * Prefetch competition resources
   */
  const prefetchCompetitionResources = async (competitionId: string) => {
    await queryClient.prefetchQuery({
      queryKey: ['competition-resources', competitionId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('cp_comp_resources')
          .select('*, cadet_profile:profiles!resource(first_name, last_name)')
          .eq('competition_id', competitionId)
          .order('start_time', { ascending: true });

        if (error) throw error;
        return data || [];
      },
      staleTime: 2 * 60 * 1000,
    });
  };

  /**
   * Comprehensive prefetch for competition details page
   * Prefetches all data that will likely be needed
   */
  const prefetchCompetitionDetailsPage = async (competitionId: string) => {
    // Prefetch in parallel for maximum efficiency
    await Promise.allSettled([
      prefetchCompetitionDetails(competitionId),
      prefetchCompetitionEvents(competitionId),
      prefetchEventRegistrations(competitionId),
      prefetchRegisteredSchools(competitionId),
      prefetchJudges(),
      prefetchCompetitionSchedule(competitionId),
      prefetchJudgeSchedule(competitionId),
      prefetchResourceSchedule(competitionId),
      prefetchCompetitionResources(competitionId),
    ]);
  };

  return {
    prefetchCompetitionDetails,
    prefetchCompetitionEvents,
    prefetchEventRegistrations,
    prefetchJudges,
    prefetchRegisteredSchools,
    prefetchCompetitionSchedule,
    prefetchJudgeSchedule,
    prefetchResourceSchedule,
    prefetchCompetitionResources,
    prefetchCompetitionDetailsPage,
  };
};
