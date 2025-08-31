import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// PT Tests Hook
export const useCadetPTTests = (cadetId: string) => {
  return useQuery({
    queryKey: ['cadetPTTests', cadetId],
    queryFn: async () => {
      if (!cadetId) return [];
      
      const { data, error } = await supabase
        .from('pt_tests')
        .select(`
          id,
          date,
          push_ups,
          sit_ups,
          plank_time,
          mile_time,
          created_at
        `)
        .eq('cadet_id', cadetId)
        .order('date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!cadetId,
  });
};

// Uniform Inspections Hook
export const useCadetInspections = (cadetId: string) => {
  return useQuery({
    queryKey: ['cadetInspections', cadetId],
    queryFn: async () => {
      if (!cadetId) return [];
      
      const { data, error } = await supabase
        .from('uniform_inspections')
        .select(`
          id,
          date,
          grade,
          notes,
          created_at
        `)
        .eq('cadet_id', cadetId)
        .order('date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!cadetId,
  });
};

// Community Service Hook
export const useCadetCommunityService = (cadetId: string) => {
  return useQuery({
    queryKey: ['cadetCommunityService', cadetId],
    queryFn: async () => {
      if (!cadetId) return [];
      
      const { data, error } = await supabase
        .from('community_service')
        .select(`
          id,
          date,
          event,
          hours,
          notes,
          created_at
        `)
        .eq('cadet_id', cadetId)
        .order('date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!cadetId,
  });
};

// Equipment Hook (placeholder for now as table structure unknown)
export const useCadetEquipment = (cadetId: string) => {
  return useQuery({
    queryKey: ['cadetEquipment', cadetId],
    queryFn: async () => {
      // Equipment table doesn't exist yet, return empty array
      return [];
    },
    enabled: !!cadetId,
  });
};

// History Hook - combining various record types
export const useCadetHistory = (cadetId: string) => {
  return useQuery({
    queryKey: ['cadetHistory', cadetId],
    queryFn: async () => {
      if (!cadetId) return [];
      
      try {
        // Get profile updates from profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, created_at, updated_at, rank, grade, flight, cadet_year')
          .eq('id', cadetId)
          .single();

        if (profileError) throw profileError;

        // Create history entries from profile data
        const historyEntries = [];
        
        if (profileData) {
          historyEntries.push({
            id: `profile-created-${profileData.id}`,
            date: profileData.created_at,
            type: 'Profile Created',
            description: 'Cadet profile was created',
            details: `Initial rank: ${profileData.rank || 'Not set'}`
          });

          if (profileData.updated_at !== profileData.created_at) {
            historyEntries.push({
              id: `profile-updated-${profileData.id}`,
              date: profileData.updated_at,
              type: 'Profile Updated',
              description: 'Cadet profile was updated',
              details: `Current rank: ${profileData.rank || 'Not set'}, Grade: ${profileData.grade || 'Not set'}`
            });
          }
        }

        return historyEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      } catch (error) {
        console.warn('History query failed:', error);
        return [];
      }
    },
    enabled: !!cadetId,
  });
};