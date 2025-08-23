import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type Competition = Database['public']['Tables']['cp_competitions']['Row'];

export const useHostedCompetitions = () => {
  const { userProfile } = useAuth();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHostedCompetitions = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('cp_competitions_hosted_view')
        .select('*')
        .eq('school_id', userProfile?.school_id)
        .order('start_date', { ascending: false });

      if (error) throw error;
      setCompetitions(data || []);
    } catch (error) {
      console.error('Error fetching hosted competitions:', error);
      toast.error('Failed to load hosted competitions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userProfile?.school_id) {
      fetchHostedCompetitions();
    }
  }, [userProfile?.school_id]);

  return {
    competitions,
    isLoading,
    refetch: fetchHostedCompetitions
  };
};