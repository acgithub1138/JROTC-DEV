import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useSchoolTimezone = () => {
  const [timezone, setTimezone] = useState<string>('America/New_York'); // Default fallback
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userProfile } = useAuth();

  useEffect(() => {
    const fetchSchoolTimezone = async () => {
      if (!userProfile?.school_id) {
        setIsLoading(false);
        return;
      }

      try {
        setError(null);
        const { data, error } = await supabase
          .from('schools')
          .select('timezone')
          .eq('id', userProfile.school_id)
          .single();

        if (error) {
          setError('Failed to fetch school timezone');
          // Don't log repeatedly to avoid console spam
        } else if (data?.timezone) {
          setTimezone(data.timezone);
        }
      } catch (error) {
        setError('Network error fetching school timezone');
        // Don't log repeatedly to avoid console spam
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch if we haven't already tried and failed
    if (!error) {
      fetchSchoolTimezone();
    } else {
      setIsLoading(false);
    }
  }, [userProfile?.school_id, error]);

  return { timezone, isLoading };
};