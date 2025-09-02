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
        // Get detailed profile change history from profile_history table
        const { data: historyData, error: historyError } = await supabase
          .from('profile_history')
          .select(`
            id,
            field_name,
            old_value,
            new_value,
            created_at,
            changed_by,
            profiles!changed_by(first_name, last_name)
          `)
          .eq('profile_id', cadetId)
          .order('created_at', { ascending: false });

        if (historyError) throw historyError;

        // Transform the data into history entries
        const historyEntries = (historyData || []).map(entry => ({
          id: entry.id,
          date: entry.created_at,
          type: 'Profile Updated',
          user_name: entry.profiles 
            ? `${entry.profiles.first_name || ''} ${entry.profiles.last_name || ''}`.trim() || 'Unknown User'
            : 'System',
          details: `${formatFieldName(entry.field_name)}: ${entry.old_value || 'Not set'} → ${entry.new_value || 'Not set'}`
        }));

        return historyEntries;
      } catch (error) {
        console.warn('History query failed:', error);
        return [];
      }
    },
    enabled: !!cadetId,
  });
};

// Helper function to format field names nicely
const formatFieldName = (fieldName: string): string => {
  const fieldMap: Record<string, string> = {
    'rank': 'Rank',
    'grade': 'Grade',
    'flight': 'Flight',
    'role': 'Role',
    'cadet_year': 'Cadet Year',
    'first_name': 'First Name',
    'last_name': 'Last Name',
    'email': 'Email',
    'phone': 'Phone',
    'start_year': 'Start Year'
  };
  
  return fieldMap[fieldName] || fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
};