import { useIncidentsQuery, useMyIncidentsQuery, useActiveIncidentsQuery, useCompletedIncidentsQuery } from './useIncidentsQuery';
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

export const useMyIncidents = () => {
  const { data: incidents = [], isLoading } = useMyIncidentsQuery();
  const mutations = useIncidentMutations();

  return {
    incidents,
    isLoading,
    ...mutations,
  };
};

export const useActiveIncidents = () => {
  const { data: incidents = [], isLoading } = useActiveIncidentsQuery();
  const mutations = useIncidentMutations();

  return {
    incidents,
    isLoading,
    ...mutations,
  };
};

export const useCompletedIncidents = () => {
  const { data: incidents = [], isLoading } = useCompletedIncidentsQuery();
  const mutations = useIncidentMutations();

  return {
    incidents,
    isLoading,
    ...mutations,
  };
};

// Re-export types for backward compatibility
export type { Incident, IncidentComment } from './types';