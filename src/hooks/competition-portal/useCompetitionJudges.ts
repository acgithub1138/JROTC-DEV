import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type CompJudge = Database['public']['Tables']['cp_comp_judges']['Row'];
type CompJudgeInsert = Database['public']['Tables']['cp_comp_judges']['Insert'];
type CompJudgeUpdate = Database['public']['Tables']['cp_comp_judges']['Update'];

type Judge = {
  name: string;
  email: string | null;
  phone: string | null;
  available: boolean;
};

type CompJudgeWithProfile = CompJudge & {
  judge_profile?: Judge;
};

export const useCompetitionJudges = (competitionId?: string) => {
  const { userProfile } = useAuth();
  const [judges, setJudges] = useState<CompJudgeWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchJudges = async () => {
    if (!competitionId) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('cp_comp_judges')
        .select(`
          *
        `)
        .eq('competition_id', competitionId)
        .order('start_time', { ascending: true });

      // Fetch judge details separately
      if (data && data.length > 0) {
        const judgeIds = data.map(j => j.judge);
        const { data: judgesData } = await supabase
          .from('cp_judges')
          .select('id, name, email, phone, available')
          .in('id', judgeIds);

        // Merge judge profile data
        const enrichedData = data.map(judge => ({
          ...judge,
          judge_profile: judgesData?.find(j => j.id === judge.judge)
        }));
        
        setJudges(enrichedData as CompJudgeWithProfile[]);
        setIsLoading(false);
        return;
      }

      if (error) throw error;
      setJudges(data || []);
    } catch (error) {
      console.error('Error fetching competition judges:', error);
      toast.error('Failed to load judges');
    } finally {
      setIsLoading(false);
    }
  };

  const createJudge = async (judgeData: CompJudgeInsert) => {
    if (!userProfile?.school_id) return;

    try {
      const { data, error } = await supabase
        .from('cp_comp_judges')
        .insert({
          ...judgeData,
          school_id: userProfile.school_id,
          created_by: userProfile.id
        })
        .select()
        .single();

      if (error) throw error;

      setJudges(prev => [...prev, data].sort((a, b) => 
        new Date(a.start_time || '').getTime() - new Date(b.start_time || '').getTime()
      ));
      toast.success('Judge assigned successfully');
      return data;
    } catch (error) {
      console.error('Error creating judge assignment:', error);
      toast.error('Failed to assign judge');
      throw error;
    }
  };

  const updateJudge = async (id: string, updates: CompJudgeUpdate) => {
    try {
      const { data, error } = await supabase
        .from('cp_comp_judges')
        .update({
          ...updates,
          updated_by: userProfile?.id
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setJudges(prev => 
        prev.map(judge => judge.id === id ? data : judge)
          .sort((a, b) => 
            new Date(a.start_time || '').getTime() - new Date(b.start_time || '').getTime()
          )
      );
      toast.success('Judge assignment updated successfully');
      return data;
    } catch (error) {
      console.error('Error updating judge assignment:', error);
      toast.error('Failed to update judge assignment');
      throw error;
    }
  };

  const deleteJudge = async (id: string) => {
    try {
      const { error } = await supabase
        .from('cp_comp_judges')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setJudges(prev => prev.filter(judge => judge.id !== id));
      toast.success('Judge assignment removed successfully');
    } catch (error) {
      console.error('Error deleting judge assignment:', error);
      toast.error('Failed to remove judge assignment');
      throw error;
    }
  };

  useEffect(() => {
    fetchJudges();
  }, [competitionId]);

  return {
    judges,
    isLoading,
    createJudge,
    updateJudge,
    deleteJudge,
    refetch: fetchJudges
  };
};
