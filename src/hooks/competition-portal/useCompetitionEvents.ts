import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type CompEvent = Database['public']['Tables']['cp_comp_events']['Row'] & {
  competition_event_types?: { name: string } | null;
  registration_count?: number;
  event_name?: string;
  event_description?: string;
};
type CompEventInsert = Database['public']['Tables']['cp_comp_events']['Insert'];
type CompEventUpdate = Database['public']['Tables']['cp_comp_events']['Update'];

export const useCompetitionEvents = (competitionId?: string) => {
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();

  const fetchEvents = async (): Promise<CompEvent[]> => {
    if (!competitionId || !userProfile?.school_id) return [];

    try {
      // Use optimized view that includes registration counts - eliminates N+1 queries
      const { data, error } = await supabase
        .from('cp_comp_events_detailed')
        .select('*')
        .eq('competition_id', competitionId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      let events = (data || []) as CompEvent[];

      // Enrichment fallback: if any event_name is null, fetch from competition_event_types
      const eventsWithoutNames = events.filter(e => !e.event_name && e.event);
      if (eventsWithoutNames.length > 0) {
        const eventIds = [...new Set(eventsWithoutNames.map(e => e.event))];
        const { data: eventTypes } = await supabase
          .from('competition_event_types')
          .select('id, name, description')
          .in('id', eventIds);

        if (eventTypes) {
          const typeMap = new Map(eventTypes.map(t => [t.id, t]));
          events = events.map(e => {
            if (!e.event_name && e.event) {
              const type = typeMap.get(e.event);
              return {
                ...e,
                event_name: type?.name || null,
                event_description: type?.description || null
              };
            }
            return e;
          });
        }
      }

      return events;
    } catch (error) {
      console.error('Error fetching competition events:', error);
      toast.error('Failed to load events');
      return [];
    }
  };
  
  // Use React Query for better caching and performance
  const { data: events = [], isLoading, refetch } = useQuery({
    queryKey: ['competition-events', competitionId, userProfile?.school_id],
    queryFn: fetchEvents,
    enabled: !!competitionId && !!userProfile?.school_id,
    staleTime: 2 * 60 * 1000, // 2 minutes - events don't change frequently
    gcTime: 5 * 60 * 1000, // 5 minutes cache
  });

  const createEvent = async (eventData: CompEventInsert) => {
    if (!userProfile?.school_id || !competitionId) return;

    try {
      const { data, error } = await supabase
        .from('cp_comp_events')
        .insert({
          ...eventData,
          school_id: userProfile.school_id,
          competition_id: competitionId,
          created_by: userProfile.id
        })
        .select()
        .single();

      if (error) throw error;

      // Invalidate queries to refetch with updated data
      queryClient.invalidateQueries({ queryKey: ['competition-events', competitionId, userProfile?.school_id] });
      toast.success('Event added successfully');
      return data;
    } catch (error) {
      console.error('Error creating competition event:', error);
      toast.error('Failed to add event');
      throw error;
    }
  };

  const updateEvent = async (id: string, updates: CompEventUpdate) => {
    try {
      const { data, error } = await supabase
        .from('cp_comp_events')
        .update({
          ...updates,
          updated_by: userProfile?.id
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Invalidate queries to refetch with updated data
      queryClient.invalidateQueries({ queryKey: ['competition-events', competitionId, userProfile?.school_id] });
      toast.success('Event updated successfully');
      return data;
    } catch (error) {
      console.error('Error updating competition event:', error);
      toast.error('Failed to update event');
      throw error;
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('cp_comp_events')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Invalidate queries to refetch with updated data
      queryClient.invalidateQueries({ queryKey: ['competition-events', competitionId, userProfile?.school_id] });
      toast.success('Event deleted successfully');
    } catch (error) {
      console.error('Error deleting competition event:', error);
      toast.error('Failed to delete event');
      throw error;
    }
  };

  return {
    events,
    isLoading,
    createEvent,
    updateEvent,
    deleteEvent,
    refetch
  };
};
