import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CachedProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role?: string;
}

/**
 * Normalized profile cache hook - prevents duplicate profile lookups
 * Caches all school profiles for efficient access
 */
export const useProfileCache = () => {
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();

  const { data: profileMap = new Map<string, CachedProfile>() } = useQuery({
    queryKey: ['profile-cache', userProfile?.school_id],
    queryFn: async () => {
      if (!userProfile?.school_id) return new Map<string, CachedProfile>();

      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, role')
        .eq('school_id', userProfile.school_id)
        .eq('active', true);

      if (error) {
        console.error('Error fetching profile cache:', error);
        throw error;
      }

      // Create a Map for O(1) lookups
      const map = new Map<string, CachedProfile>();
      data?.forEach((profile) => {
        map.set(profile.id, profile as CachedProfile);
      });

      return map;
    },
    enabled: !!userProfile?.school_id,
    staleTime: 10 * 60 * 1000, // 10 minutes - profiles don't change frequently
    gcTime: 30 * 60 * 1000, // 30 minutes cache
  });

  /**
   * Get a single profile from cache
   */
  const getProfile = (profileId?: string): CachedProfile | undefined => {
    if (!profileId) return undefined;
    return profileMap.get(profileId);
  };

  /**
   * Get multiple profiles from cache
   */
  const getProfiles = (profileIds: string[]): CachedProfile[] => {
    return profileIds
      .map((id) => profileMap.get(id))
      .filter((profile): profile is CachedProfile => profile !== undefined);
  };

  /**
   * Invalidate profile cache when profiles are updated
   */
  const invalidateCache = () => {
    queryClient.invalidateQueries({ queryKey: ['profile-cache'] });
  };

  return {
    profileMap,
    getProfile,
    getProfiles,
    invalidateCache,
  };
};

/**
 * Hook to get a specific profile with caching
 */
export const useProfile = (profileId?: string) => {
  const { getProfile } = useProfileCache();
  return getProfile(profileId);
};
