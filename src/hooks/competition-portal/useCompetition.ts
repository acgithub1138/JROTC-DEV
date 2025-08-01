import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Competition = {
  id: string;
  name: string;
  description: string | null;
  location: string;
  start_date: string;
  end_date: string;
  is_public: boolean;
  status: string;
  school_id: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export const useCompetition = (competitionId?: string) => {
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [isLoading, setIsLoading] = useState(!!competitionId);

  const fetchCompetition = useCallback(async () => {
    if (!competitionId) {
      setIsLoading(false);
      return;
    }

    console.log('Fetching competition with ID:', competitionId);
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('cp_competitions')
        .select('*')
        .eq('id', competitionId)
        .eq('is_public', true)
        .maybeSingle();

      if (error) {
        console.error('Error fetching competition:', error);
        toast.error('Failed to load competition details');
        return;
      }

      console.log('Competition data received:', data);
      setCompetition(data);
    } catch (error) {
      console.error('Error fetching competition:', error);
      toast.error('Failed to load competition details');
    } finally {
      setIsLoading(false);
    }
  }, [competitionId]);

  useEffect(() => {
    fetchCompetition();
  }, [fetchCompetition]);

  return {
    competition,
    isLoading,
    refetch: fetchCompetition
  };
};