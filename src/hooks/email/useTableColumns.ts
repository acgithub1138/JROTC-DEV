
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getColumnLabel, getEnhancedVariables } from '@/utils/columnLabels';
import { useAuth } from '@/contexts/AuthContext';

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
  const { userProfile } = useAuth();
  
  return useQuery({
    queryKey: ['available-tables', userProfile?.role],
    queryFn: async () => {
      // Get unique table names from schema_tracking
      const { data, error } = await supabase
        .from('schema_tracking')
        .select('table_name')
        .eq('is_active', true);
      
      if (error) throw error;
      
      // Get unique table names
      const uniqueTables = [...new Set(data.map(item => item.table_name))];
      
      // Define table labels
      const tableLabels: Record<string, string> = {
        'tasks': 'Tasks',
        'profiles': 'Profiles', 
        'competitions': 'Competitions',
        'inventory_items': 'Inventory Items',
        'expenses': 'Expenses',
        'contacts': 'Contacts',
        'events': 'Events',
        'budget_transactions': 'Budget Transactions',
        'incidents': 'Incidents'
      };
      
      // Only include tasks and incidents tables
      let availableTables = [
        { name: 'tasks', label: 'Tasks' },
        { name: 'incidents', label: 'Incidents' }
      ];
      
      // Filter out incidents table unless user is admin
      if (userProfile?.role !== 'admin') {
        availableTables = availableTables.filter(table => table.name !== 'incidents');
      }
      
      return availableTables;
    },
    enabled: !!userProfile,
  });
};
