import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type Competition = Database['public']['Tables']['cp_competitions']['Row'];
type CompetitionInsert = Database['public']['Tables']['cp_competitions']['Insert'];
type CompetitionUpdate = Database['public']['Tables']['cp_competitions']['Update'];

export const useCompetitions = () => {
  const { userProfile } = useAuth();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCompetitions = async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from('cp_competitions')
        .select('*');

      if (userProfile?.school_id) {
        query = query.or(`school_id.eq.${userProfile.school_id},is_public.eq.true`);
      } else {
        query = query.eq('is_public', true);
      }

      const { data, error } = await query.order('start_date', { ascending: false });

      if (error) throw error;
      setCompetitions(data || []);
    } catch (error) {
      console.error('Error fetching competitions:', error);
      toast.error('Failed to load competitions');
    } finally {
      setIsLoading(false);
    }
  };

  const createCompetition = async (competitionData: CompetitionInsert) => {
    if (!userProfile?.school_id) return;

    try {
      const { data, error } = await supabase
        .from('cp_competitions')
        .insert({
          ...competitionData,
          school_id: userProfile.school_id,
          created_by: userProfile.id
        })
        .select()
        .single();

      if (error) throw error;

      setCompetitions(prev => [data, ...prev]);
      toast.success('Competition created successfully');
      return data;
    } catch (error) {
      console.error('Error creating competition:', error);
      toast.error('Failed to create competition');
      throw error;
    }
  };

  const updateCompetition = async (id: string, updates: CompetitionUpdate) => {
    try {
      const { data, error } = await supabase
        .from('cp_competitions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setCompetitions(prev => 
        prev.map(comp => comp.id === id ? data : comp)
      );
      toast.success('Competition updated successfully');
      return data;
    } catch (error) {
      console.error('Error updating competition:', error);
      toast.error('Failed to update competition');
      throw error;
    }
  };

  const deleteCompetition = async (id: string) => {
    try {
      const { error } = await supabase
        .from('cp_competitions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCompetitions(prev => prev.filter(comp => comp.id !== id));
      toast.success('Competition deleted successfully');
    } catch (error) {
      console.error('Error deleting competition:', error);
      toast.error('Failed to delete competition');
      throw error;
    }
  };

  useEffect(() => {
    fetchCompetitions();
  }, [userProfile?.school_id]);

  return {
    competitions,
    isLoading,
    createCompetition,
    updateCompetition,
    deleteCompetition,
    refetch: fetchCompetitions
  };
};