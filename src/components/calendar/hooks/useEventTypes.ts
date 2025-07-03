import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface EventType {
  id: string;
  value: string;
  label: string;
  school_id: string;
  is_default: boolean;
}

export const useEventTypes = () => {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { userProfile } = useAuth();
  const { toast } = useToast();

  const fetchEventTypes = async () => {
    if (!userProfile?.school_id) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('event_types')
        .select('*')
        .eq('school_id', userProfile.school_id)
        .order('label');

      if (error) throw error;
      setEventTypes(data || []);
    } catch (error) {
      console.error('Error fetching event types:', error);
      toast({
        title: 'Error',
        description: 'Failed to load event types',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEventTypes();
  }, [userProfile?.school_id]);

  const createEventType = async (label: string) => {
    if (!userProfile?.school_id) return;

    // Generate value from label (lowercase, replace spaces with underscores)
    const value = label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

    try {
      const { data, error } = await supabase
        .from('event_types')
        .insert({
          value,
          label,
          school_id: userProfile.school_id,
          is_default: false,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: 'Error',
            description: 'An event type with this name already exists',
            variant: 'destructive',
          });
          return null;
        }
        throw error;
      }

      setEventTypes(prev => [...prev, data].sort((a, b) => a.label.localeCompare(b.label)));
      toast({
        title: 'Success',
        description: 'Event type created successfully',
      });

      return data;
    } catch (error) {
      console.error('Error creating event type:', error);
      toast({
        title: 'Error',
        description: 'Failed to create event type',
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteEventType = async (id: string) => {
    try {
      const { error } = await supabase
        .from('event_types')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setEventTypes(prev => prev.filter(type => type.id !== id));
      toast({
        title: 'Success',
        description: 'Event type deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting event type:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete event type',
        variant: 'destructive',
      });
    }
  };

  return {
    eventTypes,
    isLoading,
    createEventType,
    deleteEventType,
    refetch: fetchEventTypes,
  };
};