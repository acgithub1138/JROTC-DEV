import { useMemo } from 'react';

export interface IncidentStatusOption {
  value: string;
  label: string;
}

export const useIncidentStatusOptions = () => {
  const statusOptions = useMemo(() => {
    // These values come from the incident_status enum in the database
    const enumValues = [
      'new',
      'in_progress', 
      'need_information',
      'on_hold',
      'resolved',
      'cancelled'
    ];

    return enumValues.map((status: string): IncidentStatusOption => ({
      value: status,
      label: status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    }));
  }, []);

  return {
    statusOptions,
    isLoading: false
  };
};