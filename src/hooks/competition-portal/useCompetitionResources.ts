import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type CompResource = Database['public']['Tables']['cp_comp_resources']['Row'];
type CompResourceInsert = Database['public']['Tables']['cp_comp_resources']['Insert'];
type CompResourceUpdate = Database['public']['Tables']['cp_comp_resources']['Update'];

type CompResourceWithProfile = CompResource & {
  cadet_profile?: {
    first_name: string;
    last_name: string;
  };
};

const fetchCompetitionResources = async (competitionId: string): Promise<CompResourceWithProfile[]> => {
  const { data, error } = await supabase
    .from('cp_comp_resources')
    .select(`
      *,
      cadet_profile:profiles!resource(
        first_name,
        last_name
      )
    `)
    .eq('competition_id', competitionId)
    .order('start_time', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const useCompetitionResources = (competitionId?: string) => {
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = ['competition-resources', competitionId];

  const { data: resources = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: () => fetchCompetitionResources(competitionId!),
    enabled: !!competitionId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  const createMutation = useMutation({
    mutationFn: async (resourceData: CompResourceInsert) => {
      if (!userProfile?.school_id) throw new Error('No school ID');

      const { data, error } = await supabase
        .from('cp_comp_resources')
        .insert({
          ...resourceData,
          school_id: userProfile.school_id,
          created_by: userProfile.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['resource-schedule', competitionId] });
      toast.success('Resource added successfully');
    },
    onError: (error) => {
      console.error('Error creating resource:', error);
      toast.error('Failed to add resource');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: CompResourceUpdate }) => {
      const { data, error } = await supabase
        .from('cp_comp_resources')
        .update({
          ...updates,
          updated_by: userProfile?.id
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['resource-schedule', competitionId] });
      toast.success('Resource updated successfully');
    },
    onError: (error) => {
      console.error('Error updating resource:', error);
      toast.error('Failed to update resource');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cp_comp_resources')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['resource-schedule', competitionId] });
      toast.success('Resource removed successfully');
    },
    onError: (error) => {
      console.error('Error deleting resource:', error);
      toast.error('Failed to remove resource');
    }
  });

  const createResource = async (resourceData: CompResourceInsert) => {
    return createMutation.mutateAsync(resourceData);
  };

  const updateResource = async (id: string, updates: CompResourceUpdate) => {
    return updateMutation.mutateAsync({ id, updates });
  };

  const deleteResource = async (id: string) => {
    return deleteMutation.mutateAsync(id);
  };

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey });
  };

  return {
    resources,
    isLoading,
    error,
    createResource,
    updateResource,
    deleteResource,
    refetch
  };
};
