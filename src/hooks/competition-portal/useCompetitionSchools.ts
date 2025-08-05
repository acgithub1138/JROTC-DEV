import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

// Extend types to include the paid, color, and total_fee fields since they exist in DB but not in generated types yet
type CompSchool = Database['public']['Tables']['cp_comp_schools']['Row'] & { paid: boolean; color: string; total_fee: number };
type CompSchoolInsert = Database['public']['Tables']['cp_comp_schools']['Insert'] & { paid?: boolean; color?: string; total_fee?: number };
type CompSchoolUpdate = Database['public']['Tables']['cp_comp_schools']['Update'] & { paid?: boolean; color?: string; total_fee?: number };

export const useCompetitionSchools = (competitionId?: string) => {
  const { userProfile } = useAuth();
  const [schools, setSchools] = useState<CompSchool[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSchools = async () => {
    if (!competitionId) return;

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('cp_comp_schools')
        .select('*')
        .eq('competition_id', competitionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setSchools((data || []) as CompSchool[]);
    } catch (error) {
      console.error('Error fetching competition schools:', error);
      toast.error('Failed to load registered schools');
    } finally {
      setIsLoading(false);
    }
  };

  const createSchoolRegistration = async (schoolData: CompSchoolInsert) => {
    if (!userProfile?.school_id) return;

    try {
      const { data, error } = await supabase
        .from('cp_comp_schools')
        .insert({
          ...schoolData,
          created_by: userProfile.id
        })
        .select()
        .single();

      if (error) throw error;

      setSchools(prev => [...prev, data as CompSchool].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ));
      toast.success('School registered successfully');
      return data;
    } catch (error) {
      console.error('Error registering school:', error);
      toast.error('Failed to register school');
      throw error;
    }
  };

  const updateSchoolRegistration = async (id: string, updates: CompSchoolUpdate) => {
    try {
      const { data, error } = await supabase
        .from('cp_comp_schools')
        .update({
          ...updates,
          updated_by: userProfile?.id
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setSchools(prev => 
        prev.map(school => school.id === id ? data as CompSchool : school)
          .sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          )
      );
      toast.success('School registration updated successfully');
      return data;
    } catch (error) {
      console.error('Error updating school registration:', error);
      toast.error('Failed to update school registration');
      throw error;
    }
  };

  const deleteSchoolRegistration = async (id: string) => {
    try {
      const { error } = await supabase
        .from('cp_comp_schools')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSchools(prev => prev.filter(school => school.id !== id));
      toast.success('School registration removed successfully');
    } catch (error) {
      console.error('Error deleting school registration:', error);
      toast.error('Failed to remove school registration');
      throw error;
    }
  };

  useEffect(() => {
    fetchSchools();
  }, [competitionId]);

  return {
    schools,
    isLoading,
    createSchoolRegistration,
    updateSchoolRegistration,
    deleteSchoolRegistration,
    refetch: fetchSchools
  };
};