import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type Competition = Database['public']['Tables']['competitions']['Row'];
type CompetitionInsert = Database['public']['Tables']['competitions']['Insert'];
type CompetitionUpdate = Database['public']['Tables']['competitions']['Update'];

type ExtendedCompetition = Competition & {
  source_type: 'internal' | 'portal';
  source_competition_id: string;
};

export const useCompetitions = () => {
  const { userProfile } = useAuth();
  const [competitions, setCompetitions] = useState<ExtendedCompetition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCompetitions = async () => {
    if (!userProfile?.school_id) return;

    try {
      setIsLoading(true);
      
      // Fetch internal competitions (ones created by the school)
      const { data: internalComps, error: internalError } = await supabase
        .from('competitions')
        .select('*')
        .eq('school_id', userProfile.school_id)
        .order('competition_date', { ascending: false });

      if (internalError) throw internalError;

      // Fetch portal competitions (ones the school is registered for)
      const { data: portalComps, error: portalError } = await supabase
        .from('cp_competitions')
        .select(`
          *,
          cp_comp_schools!inner(
            school_id,
            status
          )
        `)
        .eq('cp_comp_schools.school_id', userProfile.school_id)
        .eq('cp_comp_schools.status', 'registered')
        .order('start_date', { ascending: false });

      if (portalError) throw portalError;

      // Transform and combine competitions
      const transformedInternal: ExtendedCompetition[] = (internalComps || []).map(comp => ({
        ...comp,
        source_type: 'internal' as const,
        source_competition_id: comp.id
      }));

      const transformedPortal: ExtendedCompetition[] = (portalComps || []).map(comp => ({
        id: comp.id,
        name: comp.name,
        description: comp.description,
        location: comp.location,
        competition_date: comp.start_date.split('T')[0], // Convert timestamp to date
        registration_deadline: comp.registration_deadline ? comp.registration_deadline.split('T')[0] : null,
        school_id: userProfile.school_id, // Use current school for consistency
        created_at: comp.created_at,
        updated_at: comp.updated_at,
        source_type: 'portal' as const,
        source_competition_id: comp.id,
        // Set other fields to null/default for portal competitions
        comp_type: null,
        unarmed_exhibition: null,
        unarmed_regulation: null,
        armed_inspection: null,
        armed_color_guard: null,
        armed_exhibition: null,
        armed_regulation: null,
        cadets: null,
        teams: null,
        overall_unarmed_placement: null,
        overall_armed_placement: null,
        overall_placement: null,
        unarmed_inspection: null,
        unarmed_color_guard: null
      }));

      // Combine and sort by date
      const allCompetitions = [...transformedInternal, ...transformedPortal]
        .sort((a, b) => new Date(b.competition_date).getTime() - new Date(a.competition_date).getTime());

      setCompetitions(allCompetitions);
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
        .from('competitions')
        .insert({
          ...competitionData,
          school_id: userProfile.school_id
        })
        .select()
        .single();

      if (error) throw error;

      const extendedData: ExtendedCompetition = {
        ...data,
        source_type: 'internal' as const,
        source_competition_id: data.id
      };
      setCompetitions(prev => [extendedData, ...prev]);
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
        .from('competitions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setCompetitions(prev => 
        prev.map(comp => comp.id === id ? {
          ...data,
          source_type: comp.source_type,
          source_competition_id: comp.source_competition_id
        } : comp)
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
        .from('competitions')
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