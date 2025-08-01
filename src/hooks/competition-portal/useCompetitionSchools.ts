import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type CompSchool = Database['public']['Tables']['cp_comp_schools']['Row'];
type CompSchoolInsert = Database['public']['Tables']['cp_comp_schools']['Insert'];
type CompSchoolUpdate = Database['public']['Tables']['cp_comp_schools']['Update'];

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
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSchools(data || []);
    } catch (error) {
      console.error('Error fetching competition schools:', error);
      toast.error('Failed to load schools');
    } finally {
      setIsLoading(false);
    }
  };

  const createSchool = async (schoolData: CompSchoolInsert) => {
    if (!userProfile?.school_id) return;

    try {
      const { data, error } = await supabase
        .from('cp_comp_schools')
        .insert({
          ...schoolData,
          school_id: userProfile.school_id,
          created_by: userProfile.id
        })
        .select()
        .single();

      if (error) throw error;

      setSchools(prev => [data, ...prev]);
      toast.success('School added successfully');
      return data;
    } catch (error) {
      console.error('Error creating school:', error);
      toast.error('Failed to add school');
      throw error;
    }
  };

  const updateSchool = async (id: string, updates: CompSchoolUpdate) => {
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
        prev.map(school => school.id === id ? data : school)
      );
      toast.success('School updated successfully');
      return data;
    } catch (error) {
      console.error('Error updating school:', error);
      toast.error('Failed to update school');
      throw error;
    }
  };

  const deleteSchool = async (id: string) => {
    try {
      const { error } = await supabase
        .from('cp_comp_schools')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSchools(prev => prev.filter(school => school.id !== id));
      toast.success('School removed successfully');
    } catch (error) {
      console.error('Error deleting school:', error);
      toast.error('Failed to remove school');
      throw error;
    }
  };

  useEffect(() => {
    fetchSchools();
  }, [competitionId]);

  return {
    schools,
    isLoading,
    createSchool,
    updateSchool,
    deleteSchool,
    refetch: fetchSchools
  };
};