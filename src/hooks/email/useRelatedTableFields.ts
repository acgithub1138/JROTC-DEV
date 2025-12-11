import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Convert column_name to display label: assigned_to -> Assigned To
const formatLabel = (columnName: string): string => {
  return columnName
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
};

export interface RelatedField {
  column_name: string;
  display_label: string;
  data_type: string;
}

const getRelatedTableName = (columnName: string): string | null => {
  // Map common foreign key patterns to their related tables
  const relationshipMap: Record<string, string> = {
    'assigned_to': 'profiles',
    'assigned_to_admin': 'profiles',
    'assigned_by': 'profiles',
    'created_by': 'profiles',
    'approved_by': 'profiles',
    'submitted_by': 'profiles',
    'team_lead_id': 'profiles',
    'profile_id': 'profiles',
    'team_id': 'teams',
    'budget_id': 'budget',
    'school_id': 'schools',
    'cadet_id': 'cadets',
    'competition_id': 'competitions',
    'item_id': 'inventory_items',
    'template_id': 'email_templates',
    'rule_id': 'email_rules',
    'queue_id': 'email_queue',
    'task_id': 'tasks',
    'user_id': 'profiles'
  };

  return relationshipMap[columnName] || null;
};

export const useRelatedTableFields = (columnName: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['related-table-fields', columnName],
    queryFn: async () => {
      const relatedTableName = getRelatedTableName(columnName);
      
      if (!relatedTableName) return [];
      
      const { data, error } = await supabase
        .rpc('get_table_columns', { table_name: relatedTableName });

      if (error) throw error;
      
      // Filter out system fields and return commonly used fields
      const commonFields = data.filter((column: any) => 
        !['id', 'created_at', 'updated_at', 'school_id'].includes(column.column_name)
      );
      
      return commonFields.map((column: any) => ({
        column_name: column.column_name,
        display_label: formatLabel(column.column_name),
        data_type: column.data_type
      })) as RelatedField[];
    },
    enabled: enabled && !!getRelatedTableName(columnName),
  });
};
