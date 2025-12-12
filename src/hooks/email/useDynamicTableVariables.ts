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

interface ContextVariable {
  name: string;
  label: string;
  description: string;
}

interface DynamicVariables {
  basicFields: BasicField[];
  referenceGroups: ReferenceGroup[];
  contextVariables: ContextVariable[];
  allVariables: Array<{ name: string; label: string; description?: string }>;
}

// Context variables that are always available regardless of source table
const CONTEXT_VARIABLES: ContextVariable[] = [
  { name: 'school_name', label: 'School Name', description: 'Current school name' },
  { name: 'school_logo_url', label: 'School Logo URL', description: 'Current school logo image URL' },
];

// Convert column_name to display label: assigned_to -> Assigned To
const formatLabel = (columnName: string): string => {
  return columnName
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
};

// Columns to exclude from source table variables (internal/system columns)
const EXCLUDED_COLUMNS = ['id', 'created_at', 'updated_at', 'created_by', 'updated_by'];

// Columns to exclude from referenced table variables
const SYSTEM_COLUMNS = ['id', 'created_at', 'updated_at', 'created_by', 'updated_by', 'school_id'];

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

        // Check if this is a foreign key - dynamically fetch referenced table columns
        if (col.referenced_table) {
          // Fetch columns for the referenced table dynamically
          const { data: refTableColumns } = await supabase.rpc('get_table_columns', {
            table_name: col.referenced_table,
          });
          
          if (refTableColumns && refTableColumns.length > 0) {
            const groupLabel = formatLabel(col.column_name);
            
            // Filter out system columns from referenced table
            const usefulColumns = refTableColumns.filter(
              (refCol: { column_name: string }) => !SYSTEM_COLUMNS.includes(refCol.column_name)
            );
            
            const fields = usefulColumns.map((refCol: { column_name: string }) => ({
              name: `${col.column_name}.${refCol.column_name}`,
              label: formatLabel(refCol.column_name),
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
          }
        } else {
          // Basic field (non-FK)
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

      // Add context variables to allVariables
      CONTEXT_VARIABLES.forEach((cv) => {
        allVariables.push({
          name: cv.name,
          label: cv.label,
          description: cv.description,
        });
      });

      return { basicFields, referenceGroups, contextVariables: CONTEXT_VARIABLES, allVariables };
    },
    enabled: !!columnsQuery.data && columnsQuery.data.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  return {
    basicFields: processedVariables.data?.basicFields || [],
    referenceGroups: processedVariables.data?.referenceGroups || [],
    contextVariables: processedVariables.data?.contextVariables || CONTEXT_VARIABLES,
    allVariables: processedVariables.data?.allVariables || [],
    isLoading: columnsQuery.isLoading || processedVariables.isLoading,
    error: columnsQuery.error || processedVariables.error,
  };
};

// Hook to get available email source tables - dynamically from information_schema
export const useEmailSourceTables = () => {
  return useQuery({
    queryKey: ['email-source-tables'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_public_tables');
      
      if (error) throw error;
      
      return (data || []).map((t: { table_name: string; display_label: string }) => ({
        name: t.table_name,
        label: t.display_label,
      }));
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};
