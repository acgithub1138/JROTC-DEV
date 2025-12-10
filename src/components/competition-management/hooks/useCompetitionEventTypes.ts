import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface CompetitionEventType {
  id: string;
  name: string;
  initials?: string;
  weight?: number;
  is_active: boolean;
  is_default: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export const useCompetitionEventTypes = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: eventTypes,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['competition-event-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('competition_event_types')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as CompetitionEventType[];
    },
    staleTime: 15 * 60 * 1000, // 15 minutes - event types change infrequently
    gcTime: 30 * 60 * 1000, // 30 minutes cache
  });

  const addEventTypeMutation = useMutation({
    mutationFn: async ({ name, initials, weight }: { name: string; initials?: string; weight?: number }) => {
      if (!user) throw new Error('User not authenticated');

      // Check if event type already exists
      const { data: existing } = await supabase
        .from('competition_event_types')
        .select('name')
        .eq('name', name)
        .maybeSingle();

      if (existing) {
        throw new Error('Event type already exists');
      }

      // Get the next sort order
      const { data: lastOrder } = await supabase
        .from('competition_event_types')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1)
        .maybeSingle();

      const newSortOrder = (lastOrder?.sort_order || 0) + 1;

      const { data, error } = await supabase
        .from('competition_event_types')
        .insert({
          name,
          initials,
          weight,
          sort_order: newSortOrder,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as CompetitionEventType;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competition-event-types'] });
      toast({
        title: "Success",
        description: "Event type added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add event type",
        variant: "destructive",
      });
    },
  });

  const addEventType = (name: string, initials?: string, weight?: number) => {
    return addEventTypeMutation.mutateAsync({ name, initials, weight });
  };

  return {
    eventTypes: eventTypes || [],
    isLoading,
    error,
    addEventType,
    isAddingEventType: addEventTypeMutation.isPending,
  };
};