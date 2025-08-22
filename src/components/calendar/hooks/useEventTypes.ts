import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface EventType {
  id: string;
  value: string;
  label: string;
  color?: string;
  school_id: string | null; // Now nullable for global defaults
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
        .or(`school_id.is.null,school_id.eq.${userProfile.school_id}`)
        .order('is_default', { ascending: false })
        .order('label', { ascending: true }); // Show defaults first, then custom types alphabetically

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

  const createEventType = async (value: string, label: string, color?: string) => {
    if (!userProfile?.school_id) return;

    try {
      const { data, error } = await supabase
        .from('event_types')
        .insert({
          value,
          label,
          color,
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

      setEventTypes(prev => [...prev, data].sort((a, b) => {
        // Sort by is_default first (defaults first), then by label
        if (a.is_default !== b.is_default) {
          return b.is_default ? 1 : -1;
        }
        return a.label.localeCompare(b.label);
      }));
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
    // Find the event type to check if it's a default (global) type
    const eventType = eventTypes.find(type => type.id === id);
    if (eventType?.is_default) {
      toast({
        title: 'Error',
        description: 'Global default event types cannot be deleted, but you can edit them',
        variant: 'destructive',
      });
      return;
    }

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

  const updateEventType = async (id: string, updates: { value?: string; label?: string; color?: string }) => {
    try {
      const updateData: any = { ...updates };

      const { data, error } = await supabase
        .from('event_types')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setEventTypes(prev => prev.map(type => 
        type.id === id ? data : type
      ).sort((a, b) => {
        if (a.is_default !== b.is_default) {
          return b.is_default ? 1 : -1;
        }
        return a.label.localeCompare(b.label);
      }));
      
      toast({
        title: 'Success',
        description: 'Event type updated successfully',
      });

      return data;
    } catch (error) {
      console.error('Error updating event type:', error);
      toast({
        title: 'Error',
        description: 'Failed to update event type',
        variant: 'destructive',
      });
      return null;
    }
  };

  return {
    eventTypes,
    isLoading,
    createEventType,
    updateEventType,
    deleteEventType,
    refetch: fetchEventTypes,
  };
};