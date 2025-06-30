
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getColumnLabel, getEnhancedVariables } from '@/utils/columnLabels';

export interface TableColumn {
  column_name: string;
  data_type: string;
  display_label: string;
}

export interface EnhancedVariable {
  variable: string;
  label: string;
  type: 'profile_reference';
}

export const useTableColumns = (tableName: string) => {
  return useQuery({
    queryKey: ['table-columns', tableName],
    queryFn: async () => {
      if (!tableName) return [];
      
      const { data, error } = await supabase
        .rpc('get_table_columns', { table_name: tableName });

      if (error) throw error;
      
      return data.map((column: any) => ({
        ...column,
        display_label: getColumnLabel(column.column_name, tableName)
      })) as TableColumn[];
    },
    enabled: !!tableName,
  });
};

export const useEnhancedVariables = (tableName: string) => {
  return useQuery({
    queryKey: ['enhanced-variables', tableName],
    queryFn: async () => {
      if (!tableName) return [];
      
      return getEnhancedVariables(tableName).map(variable => ({
        ...variable,
        type: 'profile_reference' as const
      }));
    },
    enabled: !!tableName,
  });
};

export const useAvailableTables = () => {
  return useQuery({
    queryKey: ['available-tables'],
    queryFn: async () => {
      // Return commonly used tables that users would want to create email templates for
      return [
        { name: 'tasks', label: 'Tasks' },
        { name: 'cadets', label: 'Cadets' },
        { name: 'profiles', label: 'Profiles' },
        { name: 'teams', label: 'Teams' },
        { name: 'competitions', label: 'Competitions' },
        { name: 'inventory_items', label: 'Inventory Items' },
        { name: 'expenses', label: 'Expenses' },
      ];
    },
  });
};
