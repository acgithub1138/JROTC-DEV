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
        .neq('location', '')
        .order('location', { ascending: true });

      if (error) throw error;

      // Robust unique locations (normalize unicode, collapse spaces, trim, case-insensitive)
      const canonicalize = (s: string) =>
        s
          .normalize('NFKC')
          .replace(/\s+/g, ' ')
          .trim()
          .toLowerCase();

      const locationMap = new Map<string, string>();
      data.forEach((item) => {
        if (item.location) {
          const normalized = item.location.normalize('NFKC').replace(/\s+/g, ' ').trim();
          if (normalized.length === 0) return;
          const key = canonicalize(item.location);
          if (!locationMap.has(key)) {
            locationMap.set(key, normalized);
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
