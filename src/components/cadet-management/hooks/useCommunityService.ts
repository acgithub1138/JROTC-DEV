import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface CommunityServiceRecord {
  id: string;
  school_id: string;
  cadet_id: string;
  date: string;
  event: string;
  hours: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  cadet: {
    id: string;
    first_name: string;
    last_name: string;
    grade: string | null;
    rank: string | null;
  };
}

export interface CreateCommunityServiceData {
  cadet_id: string;
  date: string;
  event: string;
  hours: number;
  notes?: string;
}

export interface UpdateCommunityServiceData extends CreateCommunityServiceData {
  id: string;
}

export interface BulkCreateCommunityServiceData {
  cadetIds: string[];
  date: string;
  event: string;
  hours: number;
  notes?: string;
}

export const useCommunityService = (searchTerm?: string, selectedDate?: Date) => {
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();

  const { data: records = [], isLoading, error } = useQuery({
    queryKey: ['community-service', userProfile?.school_id, searchTerm, selectedDate?.toDateString()],
    queryFn: async () => {
      if (!userProfile?.school_id) return [];

      let query = supabase
        .from('community_service')
        .select(`
          id,
          school_id,
          cadet_id,
          date,
          event,
          hours,
          notes,
          created_at,
          updated_at,
          cadet:profiles!cadet_id (
            id,
            first_name,
            last_name,
            grade,
            rank
          )
        `)
        .eq('school_id', userProfile.school_id)
        .order('date', { ascending: false });

      // Filter by date if provided
      if (selectedDate) {
        const dateStr = selectedDate.toISOString().split('T')[0];
        query = query.eq('date', dateStr);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching community service records:', error);
        throw error;
      }

      let filteredData = data || [];

      // Filter by search term if provided
      if (searchTerm && searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        filteredData = filteredData.filter((record: any) => {
          const cadetName = `${record.cadet?.first_name || ''} ${record.cadet?.last_name || ''}`.toLowerCase();
          const event = record.event?.toLowerCase() || '';
          const notes = record.notes?.toLowerCase() || '';
          return cadetName.includes(searchLower) || event.includes(searchLower) || notes.includes(searchLower);
        });
      }

      return filteredData as CommunityServiceRecord[];
    },
    enabled: !!userProfile?.school_id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateCommunityServiceData) => {
      if (!userProfile?.school_id) throw new Error('No school ID');

      const { data: result, error } = await supabase
        .from('community_service')
        .insert({
          ...data,
          school_id: userProfile.school_id,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-service'] });
      toast.success('Community service record created successfully');
    },
    onError: (error) => {
      console.error('Error creating community service record:', error);
      toast.error('Failed to create community service record');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateCommunityServiceData) => {
      const { id, ...updateData } = data;
      const { data: result, error } = await supabase
        .from('community_service')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-service'] });
      toast.success('Community service record updated successfully');
    },
    onError: (error) => {
      console.error('Error updating community service record:', error);
      toast.error('Failed to update community service record');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('community_service')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-service'] });
      toast.success('Community service record deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting community service record:', error);
      toast.error('Failed to delete community service record');
    },
  });

  const bulkCreateMutation = useMutation({
    mutationFn: async (data: BulkCreateCommunityServiceData) => {
      if (!userProfile?.school_id) throw new Error('No school ID');

      const { cadetIds, ...eventData } = data;
      const records = cadetIds.map(cadetId => ({
        ...eventData,
        cadet_id: cadetId,
        school_id: userProfile.school_id,
      }));

      const { data: results, error } = await supabase
        .from('community_service')
        .insert(records)
        .select();

      if (error) throw error;
      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['community-service'] });
      toast.success(`${results.length} community service records created successfully`);
    },
    onError: (error) => {
      console.error('Error creating community service records:', error);
      toast.error('Failed to create community service records');
    },
  });

  return {
    records,
    isLoading,
    error,
    createRecord: createMutation.mutate,
    updateRecord: updateMutation.mutate,
    deleteRecord: deleteMutation.mutate,
    bulkCreateRecords: bulkCreateMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isBulkCreating: bulkCreateMutation.isPending,
  };
};