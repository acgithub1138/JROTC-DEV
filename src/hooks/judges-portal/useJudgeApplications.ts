import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface JudgeApplication {
  id: string;
  judge_id: string;
  competition_id: string;
  status: 'pending' | 'approved' | 'declined' | 'withdrawn';
  availability_notes: string | null;
  decline_reason: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  cp_competitions?: {
    name: string;
    location: string;
    start_date: string;
    end_date: string;
    hosting_school: string | null;
  };
}

export const useJudgeApplications = (judgeId?: string) => {
  const queryClient = useQueryClient();

  // Get all applications for a judge
  const {
    data: applications = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['judge-applications', judgeId],
    queryFn: async () => {
      if (!judgeId) return [];

      const { data, error } = await supabase
        .from('cp_judge_competition_registrations')
        .select(`
          *,
          cp_competitions (
            name,
            location,
            start_date,
            end_date,
            hosting_school
          )
        `)
        .eq('judge_id', judgeId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as JudgeApplication[];
    },
    enabled: !!judgeId
  });

  // Apply to competition
  const applyMutation = useMutation({
    mutationFn: async ({
      judgeId,
      competitionId,
      availabilityNotes
    }: {
      judgeId: string;
      competitionId: string;
      availabilityNotes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if there's an existing withdrawn application
      const { data: existingApp } = await supabase
        .from('cp_judge_competition_registrations')
        .select('id, status')
        .eq('judge_id', judgeId)
        .eq('competition_id', competitionId)
        .maybeSingle();

      // If withdrawn application exists, update it
      if (existingApp && existingApp.status === 'withdrawn') {
        const { data, error } = await supabase
          .from('cp_judge_competition_registrations')
          .update({
            status: 'pending',
            availability_notes: availabilityNotes,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingApp.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }

      // Otherwise, insert new application
      const { data, error } = await supabase
        .from('cp_judge_competition_registrations')
        .insert({
          judge_id: judgeId,
          competition_id: competitionId,
          status: 'pending',
          availability_notes: availabilityNotes,
          created_by: user.id
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['judge-applications'] });
      toast.success('Application submitted successfully');
    },
    onError: (error: any) => {
      console.error('Error applying to competition:', error);
      toast.error(error.message || 'Failed to submit application');
    }
  });

  // Withdraw application
  const withdrawMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      const { error } = await supabase
        .from('cp_judge_competition_registrations')
        .update({ status: 'withdrawn' })
        .eq('id', applicationId)
        .eq('status', 'pending'); // Can only withdraw pending applications
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['judge-applications'] });
      toast.success('Application withdrawn');
    },
    onError: (error: any) => {
      console.error('Error withdrawing application:', error);
      toast.error(error.message || 'Failed to withdraw application');
    }
  });

  return {
    applications,
    isLoading,
    error,
    applyToCompetition: applyMutation.mutate,
    withdrawApplication: withdrawMutation.mutate,
    isApplying: applyMutation.isPending,
    isWithdrawing: withdrawMutation.isPending,
  };
};
