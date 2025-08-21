import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type CompetitionEvent = Database['public']['Tables']['competition_events']['Row'];
type CompetitionEventInsert = Database['public']['Tables']['competition_events']['Insert'];
type CompetitionEventUpdate = Database['public']['Tables']['competition_events']['Update'];

export const useCompetitionEvents = (competitionId?: string, sourceType?: 'internal' | 'portal') => {
  const { userProfile } = useAuth();
  const [events, setEvents] = useState<CompetitionEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEvents = async () => {
    if (!competitionId || !userProfile?.school_id) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('competition_events')
        .select(`
          *,
          competition_event_types!inner(name, id)
        `)
        .eq('source_competition_id', competitionId)
        .eq('source_type', sourceType || 'internal')
        .eq('school_id', userProfile.school_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching competition events:', error);
      toast.error('Failed to load competition events');
    } finally {
      setIsLoading(false);
    }
  };

  const createEvent = async (eventData: CompetitionEventInsert) => {
    if (!userProfile?.school_id || !competitionId) return;

    try {
      const { data, error } = await supabase
        .from('competition_events')
        .insert({
          ...eventData,
          school_id: userProfile.school_id,
          source_competition_id: competitionId,
          source_type: sourceType || 'internal',
          // Keep competition_id for backward compatibility with internal competitions
          competition_id: sourceType === 'internal' ? competitionId : null
        })
        .select('*')
        .single();

      if (error) throw error;

      setEvents(prev => [data, ...prev]);
      toast.success('Event added successfully');
      return data;
    } catch (error) {
      console.error('Error creating competition event:', error);
      toast.error('Failed to add event');
      throw error;
    }
  };

  const updateEvent = async (id: string, updates: CompetitionEventUpdate) => {
    try {
      const { data, error } = await supabase
        .from('competition_events')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;

      setEvents(prev => 
        prev.map(event => event.id === id ? data : event)
      );
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
        .from('competition_events')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setEvents(prev => prev.filter(event => event.id !== id));
      toast.success('Event deleted successfully');
    } catch (error) {
      console.error('Error deleting competition event:', error);
      toast.error('Failed to delete event');
      throw error;
    }
  };

  useEffect(() => {
    if (competitionId) {
      fetchEvents();
    }
  }, [competitionId, userProfile?.school_id]);

  return {
    events,
    isLoading,
    createEvent,
    updateEvent,
    deleteEvent,
    refetch: fetchEvents
  };
};