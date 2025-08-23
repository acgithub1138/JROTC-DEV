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
      
      const { data, error } = await supabase.functions.invoke('get-hosted-competitions');

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
    fetchHostedCompetitions();
  }, []);

  return {
    competitions,
    isLoading,
    refetch: fetchHostedCompetitions
  };
};