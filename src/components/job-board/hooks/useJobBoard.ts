
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { JobBoard, JobBoardWithCadet, NewJobBoard } from '../types';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export const useJobBoard = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for email confirmation modal
  const [emailConfirmModal, setEmailConfirmModal] = useState<{
    open: boolean;
    currentEmail: string;
    newEmail: string;
    cadetName: string;
    onReplace: () => void;
    onKeep: () => void;
  }>({
    open: false,
    currentEmail: '',
    newEmail: '',
    cadetName: '',
    onReplace: () => {},
    onKeep: () => {},
  });

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
      return data as unknown as JobBoardWithCadet[];
    },
    enabled: !!userProfile?.school_id,
  });

  const createJob = useMutation({
    mutationFn: async (newJob: NewJobBoard) => {
      const { data, error } = await supabase
        .from('job_board')
        .insert({ ...newJob, school_id: userProfile?.school_id } as any)
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

      // If cadet is assigned and job has email, handle job_role_email
      if (data.cadet_id && data.email_address) {
        // Check if user already has a job_role_email
        const { data: profile } = await supabase
          .from('profiles')
          .select('job_role_email')
          .eq('id', data.cadet_id)
          .single();

        if (profile?.job_role_email && profile.job_role_email !== data.email_address) {
          // Get cadet name for the modal
          const { data: cadetProfile } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', data.cadet_id)
            .single();
          
          const cadetName = cadetProfile ? `${cadetProfile.first_name} ${cadetProfile.last_name}` : 'This cadet';
          
          // Show modal to ask user if they want to replace existing email
          return new Promise((resolve, reject) => {
            setEmailConfirmModal({
              open: true,
              currentEmail: profile.job_role_email!,
              newEmail: data.email_address,
              cadetName,
              onReplace: async () => {
                const { error: profileError } = await supabase
                  .from('profiles')
                  .update({ job_role_email: data.email_address })
                  .eq('id', data.cadet_id);

                if (profileError) {
                  console.warn('Failed to update profile job_role_email:', profileError);
                }
                resolve(data);
              },
              onKeep: () => {
                resolve(data);
              },
            });
          });
        } else if (!profile?.job_role_email) {
          // Set job_role_email if user doesn't have one
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ job_role_email: data.email_address })
            .eq('id', data.cadet_id);

          if (profileError) {
            console.warn('Failed to update profile job_role_email:', profileError);
          }
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
    mutationFn: async ({ id, updates, suppressToast }: { id: string; updates: Partial<NewJobBoard>; suppressToast?: boolean }) => {
      // Get the current job data before updating
      const { data: currentJob } = await supabase
        .from('job_board')
        .select('cadet_id, email_address')
        .eq('id', id)
        .single();

      // Update the job board entry
      const { data, error } = await supabase
        .from('job_board')
        .update(updates as any)
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

      // Handle cadet assignment changes
      if (oldCadetId && oldCadetId !== newCadetId) {
        // Check if old cadet has other job roles before clearing email
        const { data: otherJobs } = await supabase
          .from('job_board')
          .select('email_address')
          .eq('cadet_id', oldCadetId)
          .eq('school_id', userProfile?.school_id)
          .neq('id', id);

        if (otherJobs && otherJobs.length > 0) {
          // Update to the first available job role email
          const nextEmail = otherJobs.find(job => job.email_address)?.email_address;
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ job_role_email: nextEmail || null })
            .eq('id', oldCadetId);

          if (updateError) {
            console.warn('Failed to update old cadet job_role_email:', updateError);
          }
        } else {
          // Clear job_role_email if no other jobs
          const { error: clearError } = await supabase
            .from('profiles')
            .update({ job_role_email: null })
            .eq('id', oldCadetId);

          if (clearError) {
            console.warn('Failed to clear previous cadet job_role_email:', clearError);
          }
        }
      }

      // Handle new cadet assignment
      if (newCadetId && jobEmail) {
        // Check if user already has a job_role_email
        const { data: profile } = await supabase
          .from('profiles')
          .select('job_role_email')
          .eq('id', newCadetId)
          .single();

        if (profile?.job_role_email && profile.job_role_email !== jobEmail) {
          // Get cadet name for the modal
          const { data: cadetProfile } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', newCadetId)
            .single();
          
          const cadetName = cadetProfile ? `${cadetProfile.first_name} ${cadetProfile.last_name}` : 'This cadet';
          
          // Show modal to ask user if they want to replace existing email
          return new Promise((resolve, reject) => {
            setEmailConfirmModal({
              open: true,
              currentEmail: profile.job_role_email!,
              newEmail: jobEmail,
              cadetName,
              onReplace: async () => {
                const { error: profileError } = await supabase
                  .from('profiles')
                  .update({ job_role_email: jobEmail })
                  .eq('id', newCadetId);

                if (profileError) {
                  console.warn('Failed to update profile job_role_email:', profileError);
                }
                resolve(data);
              },
              onKeep: () => {
                resolve(data);
              },
            });
          });
        } else if (!profile?.job_role_email) {
          // Set job_role_email if user doesn't have one
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ job_role_email: jobEmail })
            .eq('id', newCadetId);

          if (profileError) {
            console.warn('Failed to update profile job_role_email:', profileError);
          }
        }
      }

      // Store suppressToast flag for use in onSuccess
      (data as any).__suppressToast = suppressToast;

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['job-board'] });
      // Only show toast if not suppressed
      if (!(data as any).__suppressToast) {
        toast({
          title: "Success",
          description: "Job updated successfully",
        });
      }
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

      // Handle cadet job_role_email when deleting job
      if (jobToDelete?.cadet_id) {
        // Check if cadet has other job roles
        const { data: otherJobs } = await supabase
          .from('job_board')
          .select('email_address')
          .eq('cadet_id', jobToDelete.cadet_id)
          .eq('school_id', userProfile?.school_id);

        if (otherJobs && otherJobs.length > 0) {
          // Update to the first available job role email
          const nextEmail = otherJobs.find(job => job.email_address)?.email_address;
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ job_role_email: nextEmail || null })
            .eq('id', jobToDelete.cadet_id);

          if (updateError) {
            console.warn('Failed to update cadet job_role_email:', updateError);
          }
        } else {
          // Clear job_role_email if no other jobs
          const { error: clearError } = await supabase
            .from('profiles')
            .update({ job_role_email: null })
            .eq('id', jobToDelete.cadet_id);

          if (clearError) {
            console.warn('Failed to clear cadet job_role_email on job deletion:', clearError);
          }
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
    emailConfirmModal,
    setEmailConfirmModal,
  };
};
