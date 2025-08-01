import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type CompEvent = Database['public']['Tables']['cp_comp_events']['Row'];
type CompEventInsert = Database['public']['Tables']['cp_comp_events']['Insert'];
type CompEventUpdate = Database['public']['Tables']['cp_comp_events']['Update'];

export const useCompetitionEvents = (competitionId?: string) => {
  const { userProfile } = useAuth();
  const [events, setEvents] = useState<CompEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEvents = async () => {
    if (!competitionId) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('cp_comp_events')
        .select('*')
        .eq('competition_id', competitionId)
        .order('start_time', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching competition events:', error);
      toast.error('Failed to load events');
    } finally {
      setIsLoading(false);
    }
  };

  const createEvent = async (eventData: CompEventInsert) => {
    if (!userProfile?.school_id) return;

    try {
      const { data, error } = await supabase
        .from('cp_comp_events')
        .insert({
          ...eventData,
          school_id: userProfile.school_id,
          created_by: userProfile.id
        })
        .select()
        .single();

      if (error) throw error;

      setEvents(prev => [...prev, data].sort((a, b) => 
        new Date(a.start_time || '').getTime() - new Date(b.start_time || '').getTime()
      ));
      toast.success('Event added successfully');
      return data;
    } catch (error) {
      console.error('Error creating event:', error);
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

      setEvents(prev => 
        prev.map(event => event.id === id ? data : event)
          .sort((a, b) => 
            new Date(a.start_time || '').getTime() - new Date(b.start_time || '').getTime()
          )
      );
      toast.success('Event updated successfully');
      return data;
    } catch (error) {
      console.error('Error updating event:', error);
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

      setEvents(prev => prev.filter(event => event.id !== id));
      toast.success('Event removed successfully');
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to remove event');
      throw error;
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [competitionId]);

  return {
    events,
    isLoading,
    createEvent,
    updateEvent,
    deleteEvent,
    refetch: fetchEvents
  };
};