import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useResourceLocations = (competitionId?: string) => {
  const { userProfile } = useAuth();
  const [locations, setLocations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userProfile?.school_id) return;
    fetchLocations();
  }, [userProfile?.school_id, competitionId]);

  const fetchLocations = async () => {
    if (!userProfile?.school_id) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('cp_comp_resources')
        .select('location')
        .eq('school_id', userProfile.school_id)
        .not('location', 'is', null)
        .order('location', { ascending: true });

      if (error) throw error;

      // Get unique locations (case-insensitive, trimmed)
      const locationMap = new Map<string, string>();
      data.forEach(item => {
        if (item.location) {
          const trimmed = item.location.trim();
          const key = trimmed.toLowerCase();
          if (!locationMap.has(key)) {
            locationMap.set(key, trimmed);
          }
        }
      });
      const uniqueLocations = Array.from(locationMap.values()).sort((a, b) => a.localeCompare(b));
      setLocations(uniqueLocations);
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    locations,
    isLoading,
    refetch: fetchLocations
  };
};
