import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SchoolJudgeApplication {
  id: string;
  judge_id: string;
  competition_id: string;
  status: 'pending' | 'approved' | 'declined' | 'withdrawn';
  availability_notes: string | null;
  decline_reason: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  cp_judges?: {
    name: string;
    email: string | null;
    phone: string | null;
  };
}

export const useSchoolJudgeApplications = (competitionId?: string) => {
  const queryClient = useQueryClient();

  // Get all applications for a competition
  const {
    data: applications = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['school-judge-applications', competitionId],
    queryFn: async () => {
      if (!competitionId) return [];

      const { data, error } = await supabase
        .from('cp_judge_competition_registrations')
        .select(`
          *,
          cp_judges (
            name,
            email,
            phone
          )
        `)
        .eq('competition_id', competitionId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as SchoolJudgeApplication[];
    },
    enabled: !!competitionId
  });

  // Approve application
  const approveMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('cp_judge_competition_registrations')
        .update({ 
          status: 'approved',
          updated_by: user.id
        })
        .eq('id', applicationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-judge-applications'] });
      toast.success('Judge approved');
    },
    onError: (error: any) => {
      console.error('Error approving judge:', error);
      toast.error(error.message || 'Failed to approve judge');
    }
  });

  // Decline application
  const declineMutation = useMutation({
    mutationFn: async ({
      applicationId,
      declineReason
    }: {
      applicationId: string;
      declineReason?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('cp_judge_competition_registrations')
        .update({ 
          status: 'declined',
          decline_reason: declineReason,
          updated_by: user.id
        })
        .eq('id', applicationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-judge-applications'] });
      toast.success('Judge declined');
    },
    onError: (error: any) => {
      console.error('Error declining judge:', error);
      toast.error(error.message || 'Failed to decline judge');
    }
  });

  return {
    applications,
    isLoading,
    error,
    approveApplication: approveMutation.mutate,
    declineApplication: declineMutation.mutate,
    isApproving: approveMutation.isPending,
    isDeclining: declineMutation.isPending,
  };
};
