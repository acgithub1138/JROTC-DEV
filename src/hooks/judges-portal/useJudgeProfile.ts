import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface JudgeProfile {
  id: string;
  user_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  available: boolean;
  school_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface JudgeProfileUpdate {
  name?: string;
  email?: string;
  phone?: string;
  available?: boolean;
}

export const useJudgeProfile = () => {
  const queryClient = useQueryClient();

  // Get current judge profile for logged-in user
  const {
    data: judgeProfile,
    isLoading,
    error
  } = useQuery({
    queryKey: ['judge-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('cp_judges')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as JudgeProfile | null;
    }
  });

  // Create judge profile
  const createProfileMutation = useMutation({
    mutationFn: async (profileData: JudgeProfileUpdate) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('cp_judges')
        .insert({
          user_id: user.id,
          name: profileData.name,
          email: profileData.email,
          phone: profileData.phone,
          available: profileData.available ?? true,
          school_id: null // Judges don't belong to a school by default
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['judge-profile'] });
      toast.success('Judge profile created successfully');
    },
    onError: (error: any) => {
      console.error('Error creating judge profile:', error);
      toast.error(error.message || 'Failed to create judge profile');
    }
  });

  // Update judge profile
  const updateProfileMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: JudgeProfileUpdate }) => {
      const { error } = await supabase
        .from('cp_judges')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['judge-profile'] });
      toast.success('Profile updated successfully');
    },
    onError: (error: any) => {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    }
  });

  return {
    judgeProfile,
    isLoading,
    error,
    createProfile: createProfileMutation.mutate,
    updateProfile: updateProfileMutation.mutate,
    isCreating: createProfileMutation.isPending,
    isUpdating: updateProfileMutation.isPending,
  };
};
