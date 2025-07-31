import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Define the updated types based on actual database structure
type CpEvent = {
  id: string;
  school_id: string;
  name: string;
  description?: string | null;
  score_sheet?: string | null;
  jrotc_program?: string | null;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  active?: boolean;
};

type CpEventInsert = Omit<CpEvent, 'id' | 'created_at' | 'updated_at'>;
type CpEventUpdate = Partial<Omit<CpEvent, 'id' | 'created_at' | 'updated_at'>>;

export const useCompetitionEvents = () => {
  const { userProfile } = useAuth();
  const [events, setEvents] = useState<CpEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEvents = async () => {
    if (!userProfile?.school_id) return;

    try {
      setIsLoading(true);
      const query = supabase
        .from('cp_events')
        .select('*')
        .eq('school_id', userProfile.school_id)
        .order('created_at', { ascending: false });
      
      const { data, error } = await query;

      if (error) throw error;
      // Filter out inactive events on the client side until types are updated
      const activeEvents = (data || []).filter((event: any) => event.active !== false);
      setEvents(activeEvents);
    } catch (error) {
      console.error('Error fetching competition events:', error);
      toast.error('Failed to load events');
    } finally {
      setIsLoading(false);
    }
  };

  const createEvent = async (eventData: { name: string; description?: string | null; score_sheet?: string | null; jrotc_program?: string | null }) => {
    if (!userProfile?.school_id) return;

    try {
      const { data, error } = await supabase
        .from('cp_events')
        .insert({
          ...eventData,
          school_id: userProfile.school_id,
          created_by: userProfile.id
        } as any)
        .select()
        .single();

      if (error) throw error;

      // Only add to state if the event is active (consistent with fetchEvents filtering)
      if ((data as any).active !== false) {
        setEvents(prev => [data, ...prev]);
      }
      toast.success('Event created successfully');
      return data;
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Failed to create event');
      throw error;
    }
  };

  const updateEvent = async (id: string, updates: CpEventUpdate) => {
    try {
      const { data, error } = await supabase
        .from('cp_events')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setEvents(prev => 
        prev.map(event => event.id === id ? data : event)
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
        .from('cp_events')
        .update({ active: false } as any)
        .eq('id', id);

      if (error) throw error;

      setEvents(prev => prev.filter(event => event.id !== id));
      toast.success('Event archived successfully');
    } catch (error) {
      console.error('Error archiving event:', error);
      toast.error('Failed to archive event');
      throw error;
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [userProfile?.school_id]);

  return {
    events,
    isLoading,
    createEvent,
    updateEvent,
    deleteEvent,
    refetch: fetchEvents
  };
};