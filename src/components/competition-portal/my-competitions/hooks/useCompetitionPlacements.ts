import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface CompetitionPlacement {
  id: string;
  school_id: string;
  competition_id: string;
  competition_source: 'internal' | 'portal';
  event_name: string;
  placement: number | null;
  competition_date: string;
  created_at: string;
  updated_at: string;
}

export interface CompetitionPlacementInsert {
  competition_id: string;
  competition_source: 'internal' | 'portal';
  event_name: string;
  placement: number;
  competition_date: string;
  school_id?: string;
}

export interface CompetitionPlacementUpdate {
  event_name?: string;
  placement?: number;
}

export const useCompetitionPlacements = () => {
  const { userProfile } = useAuth();
  const [placements, setPlacements] = useState<CompetitionPlacement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPlacements = async () => {
    if (!userProfile?.school_id) return;

    try {
      setIsLoading(true);
      
      // For now, return empty array since table doesn't exist yet
      // Once the table is created, this will be:
      // const { data, error } = await supabase
      //   .from('competition_placements')
      //   .select('*')
      //   .eq('school_id', userProfile.school_id)
      //   .order('competition_date', { ascending: false });

      setPlacements([]);
    } catch (error) {
      console.error('Error fetching competition placements:', error);
      toast.error('Failed to load competition placements');
    } finally {
      setIsLoading(false);
    }
  };

  const createPlacement = async (placementData: CompetitionPlacementInsert) => {
    if (!userProfile?.school_id) return;

    try {
      // For now, just show a message since table doesn't exist
      toast.error('Competition placements table not yet created. Please run the database migration first.');
      return null;
    } catch (error) {
      console.error('Error creating placement:', error);
      toast.error('Failed to add placement');
      throw error;
    }
  };

  const updatePlacement = async (id: string, updates: CompetitionPlacementUpdate) => {
    try {
      toast.error('Competition placements table not yet created. Please run the database migration first.');
      return null;
    } catch (error) {
      console.error('Error updating placement:', error);
      toast.error('Failed to update placement');
      throw error;
    }
  };

  const deletePlacement = async (id: string) => {
    try {
      toast.error('Competition placements table not yet created. Please run the database migration first.');
    } catch (error) {
      console.error('Error deleting placement:', error);
      toast.error('Failed to delete placement');
      throw error;
    }
  };

  const getPlacementsForCompetition = (competitionId: string, source: 'internal' | 'portal') => {
    return placements.filter(
      p => p.competition_id === competitionId && p.competition_source === source
    );
  };

  useEffect(() => {
    fetchPlacements();
  }, [userProfile?.school_id]);

  return {
    placements,
    isLoading,
    createPlacement,
    updatePlacement,
    deletePlacement,
    getPlacementsForCompetition,
    refetch: fetchPlacements
  };
};