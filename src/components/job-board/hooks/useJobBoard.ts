
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

      // If cadet is assigned and job has email, set their job_role_email
      if (data.cadet_id && data.email_address) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ job_role_email: data.email_address })
          .eq('id', data.cadet_id);

        if (profileError) {
          console.warn('Failed to update profile job_role_email:', profileError);
        }
      }

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
      // Get the current job data before updating
      const { data: currentJob } = await supabase
        .from('job_board')
        .select('cadet_id, email_address')
        .eq('id', id)
        .single();

      // Update the job board entry
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

      // Handle job role email synchronization
      const oldCadetId = currentJob?.cadet_id;
      const newCadetId = data.cadet_id;
      const jobEmail = data.email_address;

      // If cadet assignment changed, clear old cadet's job_role_email
      if (oldCadetId && oldCadetId !== newCadetId) {
        const { error: clearError } = await supabase
          .from('profiles')
          .update({ job_role_email: null })
          .eq('id', oldCadetId);

        if (clearError) {
          console.warn('Failed to clear previous cadet job_role_email:', clearError);
        }
      }

      // If new cadet is assigned and job has email, set their job_role_email
      if (newCadetId && jobEmail) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ job_role_email: jobEmail })
          .eq('id', newCadetId);

        if (profileError) {
          console.warn('Failed to update profile job_role_email:', profileError);
        }
      }

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
      // Get the job data before deleting to clear cadet's job_role_email
      const { data: jobToDelete } = await supabase
        .from('job_board')
        .select('cadet_id')
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from('job_board')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Clear the assigned cadet's job_role_email
      if (jobToDelete?.cadet_id) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ job_role_email: null })
          .eq('id', jobToDelete.cadet_id);

        if (profileError) {
          console.warn('Failed to clear cadet job_role_email on job deletion:', profileError);
        }
      }
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
