import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type CompSchool = Database['public']['Tables']['cp_comp_schools']['Row'] & {
  schools?: {
    id: string;
    name: string;
  };
};
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
      
      // Fetch cp_comp_schools data
      const { data: schoolsData, error: schoolsError } = await supabase
        .from('cp_comp_schools')
        .select('*')
        .eq('competition_id', competitionId)
        .order('created_at', { ascending: true });

      if (schoolsError) throw schoolsError;

      if (!schoolsData || schoolsData.length === 0) {
        setSchools([]);
        return;
      }

      // Get unique school IDs
      const schoolIds = [...new Set(schoolsData.map(s => s.school_id))];

      // Fetch school names
      const { data: schoolNames, error: namesError } = await supabase
        .from('schools')
        .select('id, name')
        .in('id', schoolIds);

      if (namesError) throw namesError;

      // Create lookup map for school names
      const schoolNameMap = schoolNames?.reduce((acc, school) => {
        acc[school.id] = school;
        return acc;
      }, {} as Record<string, { id: string; name: string }>) || {};

      // Combine the data
      const combinedData = schoolsData.map(school => ({
        ...school,
        schools: schoolNameMap[school.school_id] || { id: school.school_id, name: 'Unknown School' }
      }));

      setSchools(combinedData);
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

      // Fetch school name for the new registration
      const { data: schoolName, error: nameError } = await supabase
        .from('schools')
        .select('id, name')
        .eq('id', data.school_id)
        .single();

      const enrichedData = {
        ...data,
        schools: schoolName || { id: data.school_id, name: 'Unknown School' }
      };

      setSchools(prev => [...prev, enrichedData].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ));
      toast.success('School registered successfully');
      return enrichedData;
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

      // Fetch school name for the updated registration
      const { data: schoolName, error: nameError } = await supabase
        .from('schools')
        .select('id, name')
        .eq('id', data.school_id)
        .single();

      const enrichedData = {
        ...data,
        schools: schoolName || { id: data.school_id, name: 'Unknown School' }
      };

      setSchools(prev => 
        prev.map(school => school.id === id ? enrichedData : school)
          .sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          )
      );
      toast.success('School registration updated successfully');
      return enrichedData;
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