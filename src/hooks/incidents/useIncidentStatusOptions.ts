import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface IncidentStatusOption {
  value: string;
  label: string;
}

export const useIncidentStatusOptions = () => {
  const { data: statusOptions = [], isLoading } = useQuery({
    queryKey: ['incident-status-options'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_incident_status_values');

      if (error) {
        console.error('Error fetching incident status options:', error);
        throw error;
      }

      return data as IncidentStatusOption[];
    },
  });

  return {
    statusOptions,
    isLoading
  };
};