import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type Competition = Database['public']['Tables']['cp_competitions']['Row'];

export const usePublicCompetitions = () => {
  const { userProfile } = useAuth();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPublicCompetitions = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('cp_competitions_public_view')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) throw error;
      setCompetitions(data || []);
    } catch (error) {
      console.error('Error fetching public competitions:', error);
      toast.error('Failed to load public competitions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicCompetitions();
  }, [userProfile?.school_id]);

  return {
    competitions,
    isLoading,
    refetch: fetchPublicCompetitions
  };
};