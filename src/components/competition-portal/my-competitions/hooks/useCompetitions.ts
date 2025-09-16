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
      
      // Use the unified view to get all competitions for the school
      const { data: allCompetitions, error } = await supabase
        .from('school_competitions')
        .select('*')
        .eq('school_id', userProfile.school_id)
        .order('competition_date', { ascending: false });

      if (error) throw error;

      // Transform to match the ExtendedCompetition type
      const transformedCompetitions: ExtendedCompetition[] = (allCompetitions || []).map(comp => ({
        id: comp.id,
        name: comp.name,
        description: comp.description,
        location: comp.location,
        competition_date: comp.competition_date.split('T')[0], // Ensure date format
        registration_deadline: comp.registration_deadline ? comp.registration_deadline.split('T')[0] : null,
        school_id: comp.school_id,
        created_at: comp.created_at,
        updated_at: comp.updated_at,
        source_type: comp.source_type as 'internal' | 'portal',
        source_competition_id: comp.source_competition_id,
        comp_type: comp.comp_type,
        teams: comp.teams,
        cadets: comp.cadets,
        overall_placement: comp.overall_placement,
        overall_armed_placement: comp.overall_armed_placement,
        overall_unarmed_placement: comp.overall_unarmed_placement,
        armed_regulation: comp.armed_regulation,
        armed_exhibition: comp.armed_exhibition,
        armed_color_guard: comp.armed_color_guard,
        armed_inspection: comp.armed_inspection,
        unarmed_regulation: comp.unarmed_regulation,
        unarmed_exhibition: comp.unarmed_exhibition,
        unarmed_color_guard: comp.unarmed_color_guard,
        unarmed_inspection: comp.unarmed_inspection
      }));

      setCompetitions(transformedCompetitions);
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