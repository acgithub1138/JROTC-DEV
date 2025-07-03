import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Event } from '../CalendarManagementPage';

interface EventFilters {
  eventType: string;
  assignedTo: string;
}

export const useEvents = (filters: EventFilters) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { userProfile } = useAuth();
  const { toast } = useToast();

  const fetchEvents = async (retryCount = 0) => {
    console.log('🔍 Fetching events - userProfile?.school_id:', userProfile?.school_id, 'isLoading:', isLoading);
    
    if (!userProfile?.school_id) {
      console.log('❌ No school_id found, skipping event fetch');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      console.log('📡 Making Supabase query for school:', userProfile.school_id);
      let query = supabase
        .from('events')
        .select('*')
        .eq('school_id', userProfile.school_id)
        .order('start_date', { ascending: true });

      if (filters.eventType) {
        query = query.eq('event_type', filters.eventType as any);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      console.log('✅ Events fetched successfully:', data?.length || 0, 'events');
      setEvents(data || []);
    } catch (error) {
      console.error('❌ Error fetching events (attempt', retryCount + 1, '):', error);
      
      // Retry up to 2 times on failure
      if (retryCount < 2) {
        console.log('🔄 Retrying event fetch in 1 second...');
        setTimeout(() => fetchEvents(retryCount + 1), 1000);
        return;
      }
      
      // Only show toast on final failure
      toast({
        title: 'Error',
        description: 'Failed to load events after multiple attempts',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [userProfile?.school_id, filters]);

  const createEvent = async (eventData: Omit<Event, 'id' | 'created_at' | 'updated_at' | 'school_id'>) => {
    if (!userProfile?.school_id) return;

    try {
      const { data, error } = await supabase
        .from('events')
        .insert({
          ...eventData,
          school_id: userProfile.school_id,
          created_by: userProfile.id,
        })
        .select()
        .single();

      if (error) throw error;

      setEvents(prev => [...prev, data]);
      toast({
        title: 'Success',
        description: 'Event created successfully',
      });
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: 'Error',
        description: 'Failed to create event',
        variant: 'destructive',
      });
    }
  };

  const updateEvent = async (id: string, eventData: Partial<Event>) => {
    try {
      const { data, error } = await supabase
        .from('events')
        .update(eventData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setEvents(prev => prev.map(event => event.id === id ? data : event));
      toast({
        title: 'Success',
        description: 'Event updated successfully',
      });
    } catch (error) {
      console.error('Error updating event:', error);
      toast({
        title: 'Error',
        description: 'Failed to update event',
        variant: 'destructive',
      });
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setEvents(prev => prev.filter(event => event.id !== id));
      toast({
        title: 'Success',
        description: 'Event deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete event',
        variant: 'destructive',
      });
    }
  };

  return {
    events,
    isLoading,
    createEvent,
    updateEvent,
    deleteEvent,
    refetch: fetchEvents,
  };
};