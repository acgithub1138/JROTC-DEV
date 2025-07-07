import { useIncidentsQuery } from './useIncidentsQuery';
import { useIncidentMutations } from './useIncidentMutations';

export const useIncidents = () => {
  const { data: incidents = [], isLoading } = useIncidentsQuery();
  const mutations = useIncidentMutations();

  return {
    incidents,
    isLoading,
    ...mutations,
  };
};

// Re-export types for backward compatibility
export type { Incident, IncidentComment, CreateIncidentData } from './types';