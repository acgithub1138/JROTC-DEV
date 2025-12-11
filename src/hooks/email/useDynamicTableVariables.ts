import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ColumnWithRelation {
  column_name: string;
  data_type: string;
  is_nullable: boolean;
  referenced_table: string | null;
  referenced_column: string | null;
}

interface BasicField {
  name: string;
  label: string;
  dataType: string;
}

interface ReferenceGroup {
  group: string;
  groupLabel: string;
  fields: Array<{ name: string; label: string }>;
}

interface DynamicVariables {
  basicFields: BasicField[];
  referenceGroups: ReferenceGroup[];
  allVariables: Array<{ name: string; label: string; description?: string }>;
}

// Convert column_name to display label: assigned_to -> Assigned To
const formatLabel = (columnName: string): string => {
  return columnName
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
};

// Columns to exclude from variables (internal/system columns)
const EXCLUDED_COLUMNS = ['id', 'school_id', 'created_at', 'updated_at', 'created_by', 'updated_by'];

// Tables that should be expandable as reference fields
const EXPANDABLE_TABLES = ['profiles', 'schools'];

// Useful columns from reference tables
const REFERENCE_TABLE_COLUMNS: Record<string, string[]> = {
  profiles: ['first_name', 'last_name', 'email', 'phone', 'grade', 'flight', 'role'],
  schools: ['name', 'logo_url', 'address', 'city', 'state', 'zip'],
};

export const useDynamicTableVariables = (tableName: string | null) => {
  // Fetch columns with relations for the source table
  const columnsQuery = useQuery({
    queryKey: ['table-columns-with-relations', tableName],
    queryFn: async () => {
      if (!tableName) return [];
      
      const { data, error } = await supabase.rpc('get_table_columns_with_relations', {
        source_table: tableName,
      });
      
      if (error) throw error;
      return (data || []) as ColumnWithRelation[];
    },
    enabled: !!tableName,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Process columns into structured variables
  const processedVariables = useQuery({
    queryKey: ['processed-variables', tableName, columnsQuery.data],
    queryFn: async (): Promise<DynamicVariables> => {
      const columns = columnsQuery.data || [];
      
      const basicFields: BasicField[] = [];
      const referenceGroups: ReferenceGroup[] = [];
      const allVariables: Array<{ name: string; label: string; description?: string }> = [];

      for (const col of columns) {
        // Skip excluded columns
        if (EXCLUDED_COLUMNS.includes(col.column_name)) continue;

        // Check if this is a foreign key to an expandable table
        if (col.referenced_table && EXPANDABLE_TABLES.includes(col.referenced_table)) {
          const refColumns = REFERENCE_TABLE_COLUMNS[col.referenced_table] || [];
          const groupLabel = formatLabel(col.column_name);
          
          const fields = refColumns.map((refCol) => ({
            name: `${col.column_name}.${refCol}`,
            label: `${formatLabel(refCol)}`,
          }));

          if (fields.length > 0) {
            referenceGroups.push({
              group: col.column_name,
              groupLabel,
              fields,
            });

            // Add to all variables with description
            fields.forEach((field) => {
              allVariables.push({
                name: field.name,
                label: `${groupLabel} - ${field.label}`,
                description: `From ${col.referenced_table} table`,
              });
            });
          }
        } else {
          // Basic field (non-FK or FK to non-expandable table)
          basicFields.push({
            name: col.column_name,
            label: formatLabel(col.column_name),
            dataType: col.data_type,
          });

          allVariables.push({
            name: col.column_name,
            label: formatLabel(col.column_name),
          });
        }
      }

      // Add special computed variables
      allVariables.push({
        name: 'last_comment',
        label: 'Last Comment',
        description: 'Most recent non-system comment on the record',
      });

      return { basicFields, referenceGroups, allVariables };
    },
    enabled: !!columnsQuery.data && columnsQuery.data.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  return {
    basicFields: processedVariables.data?.basicFields || [],
    referenceGroups: processedVariables.data?.referenceGroups || [],
    allVariables: processedVariables.data?.allVariables || [],
    isLoading: columnsQuery.isLoading || processedVariables.isLoading,
    error: columnsQuery.error || processedVariables.error,
  };
};

// Hook to get available email source tables
export const useEmailSourceTables = () => {
  return useQuery({
    queryKey: ['email-source-tables'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_email_source_tables');
      
      if (error) throw error;
      
      // Filter to tables that make sense for email templates
      const allowedTables = ['tasks', 'subtasks', 'incidents', 'profiles', 'cp_comp_schools'];
      
      return (data || [])
        .filter((t: { table_name: string }) => allowedTables.includes(t.table_name))
        .map((t: { table_name: string; display_label: string }) => ({
          name: t.table_name,
          label: t.display_label,
        }));
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};
