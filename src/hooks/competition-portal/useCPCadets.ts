import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface CPCadet {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  grade: string;
  active: boolean;
}

export interface CPCadetFormData {
  first_name: string;
  last_name: string;
  email: string;
  grade: string;
}

export function useCPCadets() {
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();
  const schoolId = userProfile?.school_id;

  const { data: cadets = [], isLoading, error } = useQuery({
    queryKey: ['cp-cadets', schoolId],
    queryFn: async () => {
      if (!schoolId) return [];

      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, grade, active')
        .eq('school_id', schoolId)
        .neq('role', 'instructor')
        .neq('role', 'admin')
        .eq('active', true)
        .order('last_name', { ascending: true })
        .order('first_name', { ascending: true });

      if (error) throw error;
      return data as CPCadet[];
    },
    enabled: !!schoolId,
  });

  const createCadetMutation = useMutation({
    mutationFn: async (cadetData: CPCadetFormData) => {
      if (!schoolId) throw new Error('No school ID found');

      const { data, error } = await supabase.functions.invoke('create-cadet-user', {
        body: {
          first_name: cadetData.first_name,
          last_name: cadetData.last_name,
          email: cadetData.email,
          grade: cadetData.grade,
          school_id: schoolId,
          role: 'cadet',
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cp-cadets', schoolId] });
      toast.success('Cadet created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create cadet: ${error.message}`);
    },
  });

  const updateCadetMutation = useMutation({
    mutationFn: async ({ id, ...cadetData }: CPCadetFormData & { id: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: cadetData.first_name,
          last_name: cadetData.last_name,
          email: cadetData.email,
          grade: cadetData.grade,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cp-cadets', schoolId] });
      toast.success('Cadet updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update cadet: ${error.message}`);
    },
  });

  const deleteCadetMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.functions.invoke('toggle-user-status', {
        body: { userId: id, active: false },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cp-cadets', schoolId] });
      toast.success('Cadet deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete cadet: ${error.message}`);
    },
  });

  const bulkImportCadets = async (
    cadetsData: CPCadetFormData[],
    onProgress?: (current: number, total: number) => void
  ) => {
    const results = { success: 0, failed: 0, errors: [] as string[] };
    const total = cadetsData.length;

    for (let i = 0; i < cadetsData.length; i++) {
      const cadet = cadetsData[i];
      try {
        await createCadetMutation.mutateAsync(cadet);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`${cadet.first_name} ${cadet.last_name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      onProgress?.(i + 1, total);
    }

    return results;
  };

  return {
    cadets,
    isLoading,
    error,
    createCadet: createCadetMutation.mutateAsync,
    updateCadet: updateCadetMutation.mutateAsync,
    deleteCadet: deleteCadetMutation.mutateAsync,
    bulkImportCadets,
    isCreating: createCadetMutation.isPending,
    isUpdating: updateCadetMutation.isPending,
    isDeleting: deleteCadetMutation.isPending,
  };
}
