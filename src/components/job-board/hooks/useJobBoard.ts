
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { JobBoard, JobBoardWithCadet, NewJobBoard } from '../types';
import { useToast } from '@/hooks/use-toast';

export const useJobBoard = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: jobs = [], isLoading, error, refetch } = useQuery({
    queryKey: ['job-board', userProfile?.school_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_board')
        .select(`
          *,
          cadet:profiles!cadet_id (
            id,
            first_name,
            last_name,
            rank,
            grade
          )
        `)
        .eq('school_id', userProfile?.school_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching job board:', error);
        throw error;
      }
      return data as JobBoardWithCadet[];
    },
    enabled: !!userProfile?.school_id,
  });

  const createJob = useMutation({
    mutationFn: async (newJob: NewJobBoard) => {
      const { data, error } = await supabase
        .from('job_board')
        .insert({
          ...newJob,
          school_id: userProfile?.school_id
        })
        .select(`
          *,
          cadet:profiles!cadet_id (
            id,
            first_name,
            last_name,
            rank
          )
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-board'] });
      toast({
        title: "Success",
        description: "Job created successfully",
      });
    },
    onError: (error) => {
      console.error('Error creating job:', error);
      toast({
        title: "Error",
        description: "Failed to create job",
        variant: "destructive",
      });
    },
  });

  const updateJob = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<NewJobBoard> }) => {
      const { data, error } = await supabase
        .from('job_board')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          cadet:profiles!cadet_id (
            id,
            first_name,
            last_name,
            rank
          )
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-board'] });
      toast({
        title: "Success",
        description: "Job updated successfully",
      });
    },
    onError: (error) => {
      console.error('Error updating job:', error);
      toast({
        title: "Error",
        description: "Failed to update job",
        variant: "destructive",
      });
    },
  });

  const deleteJob = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('job_board')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-board'] });
      toast({
        title: "Success",
        description: "Job deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Error deleting job:', error);
      toast({
        title: "Error",
        description: "Failed to delete job",
        variant: "destructive",
      });
    },
  });

  return {
    jobs,
    isLoading,
    error,
    refetch,
    createJob,
    updateJob,
    deleteJob,
  };
};
