import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CategoryOption {
  value: string;
  label: string;
}

export const useIncidentCategoryOptions = () => {
  const { data: categoryOptions = [], isLoading } = useQuery({
    queryKey: ['incident-category-options'],
    queryFn: async (): Promise<CategoryOption[]> => {
      const { data, error } = await supabase.rpc('get_incident_category_values');
      
      if (error) {
        console.error('Error fetching incident category options:', error);
        throw error;
      }

      return data || [];
    },
  });

  return {
    categoryOptions,
    isLoading,
  };
};