
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useTableRecords = (tableName: string, limit: number = 20, includeRelations: boolean = false) => {
  return useQuery({
    queryKey: ['table-records', tableName, limit, includeRelations],
    queryFn: async () => {
      if (!tableName) return [];
      
      // Define the select query based on table and whether to include relations
      let selectQuery = '*';
      
      if (includeRelations) {
        // Add common relations based on table type
        switch (tableName) {
          case 'tasks':
            selectQuery = `
              *,
              assigned_to_profile:profiles!tasks_assigned_to_fkey(id, first_name, last_name, email),
              assigned_by_profile:profiles!tasks_assigned_by_fkey(id, first_name, last_name, email)
            `;
            break;
          case 'incidents':
            selectQuery = `
              *,
              submitted_by_profile:profiles!incidents_submitted_by_fkey(id, first_name, last_name, email),
              assigned_to_profile:profiles!incidents_assigned_to_fkey(id, first_name, last_name, email)
            `;
            break;
          case 'cadets':
            selectQuery = `
              *,
              profile:profiles!cadets_profile_id_fkey(id, first_name, last_name, email)
            `;
            break;
          case 'expenses':
            selectQuery = `
              *,
              created_by_profile:profiles!expenses_created_by_fkey(id, first_name, last_name, email),
              approved_by_profile:profiles!expenses_approved_by_fkey(id, first_name, last_name, email),
              budget:budget!expenses_budget_id_fkey(id, name, category)
            `;
            break;
          case 'contacts':
            selectQuery = `
              *,
              created_by_profile:profiles!contacts_created_by_fkey(id, first_name, last_name, email)
            `;
            break;
          case 'email_templates':
            selectQuery = `
              *,
              created_by_profile:profiles!email_templates_created_by_fkey(id, first_name, last_name, email)
            `;
            break;
          case 'email_rules':
            selectQuery = `
              *,
              created_by_profile:profiles!email_rules_created_by_fkey(id, first_name, last_name, email),
              template:email_templates!email_rules_template_id_fkey(id, name, subject)
            `;
            break;
          default:
            selectQuery = '*';
        }
      }

      const { data, error } = await supabase
        .from(tableName as any)
        .select(selectQuery)
        .limit(limit)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Flatten the related data for easier template processing
      const processedData = (data || []).map((record: any) => {
        const flattened: any = { ...record };
        
        // Flatten profile relations
        if (record.assigned_to_profile) {
          flattened['assigned_to.id'] = record.assigned_to_profile.id;
          flattened['assigned_to.first_name'] = record.assigned_to_profile.first_name;
          flattened['assigned_to.last_name'] = record.assigned_to_profile.last_name;
          flattened['assigned_to.email'] = record.assigned_to_profile.email;
          flattened['assigned_to.full_name'] = `${record.assigned_to_profile.first_name} ${record.assigned_to_profile.last_name}`;
        }
        
        if (record.assigned_by_profile) {
          flattened['assigned_by.id'] = record.assigned_by_profile.id;
          flattened['assigned_by.first_name'] = record.assigned_by_profile.first_name;
          flattened['assigned_by.last_name'] = record.assigned_by_profile.last_name;
          flattened['assigned_by.email'] = record.assigned_by_profile.email;
          flattened['assigned_by.full_name'] = `${record.assigned_by_profile.first_name} ${record.assigned_by_profile.last_name}`;
        }
        
        if (record.submitted_by_profile) {
          flattened['submitted_by.id'] = record.submitted_by_profile.id;
          flattened['submitted_by.first_name'] = record.submitted_by_profile.first_name;
          flattened['submitted_by.last_name'] = record.submitted_by_profile.last_name;
          flattened['submitted_by.email'] = record.submitted_by_profile.email;
          flattened['submitted_by.full_name'] = `${record.submitted_by_profile.first_name} ${record.submitted_by_profile.last_name}`;
        }
        
        if (record.created_by_profile) {
          flattened['created_by.id'] = record.created_by_profile.id;
          flattened['created_by.first_name'] = record.created_by_profile.first_name;
          flattened['created_by.last_name'] = record.created_by_profile.last_name;
          flattened['created_by.email'] = record.created_by_profile.email;
          flattened['created_by.full_name'] = `${record.created_by_profile.first_name} ${record.created_by_profile.last_name}`;
        }
        
        if (record.approved_by_profile) {
          flattened['approved_by.id'] = record.approved_by_profile.id;
          flattened['approved_by.first_name'] = record.approved_by_profile.first_name;
          flattened['approved_by.last_name'] = record.approved_by_profile.last_name;
          flattened['approved_by.email'] = record.approved_by_profile.email;
          flattened['approved_by.full_name'] = `${record.approved_by_profile.first_name} ${record.approved_by_profile.last_name}`;
        }
        
        if (record.profile) {
          flattened['profile.id'] = record.profile.id;
          flattened['profile.first_name'] = record.profile.first_name;
          flattened['profile.last_name'] = record.profile.last_name;
          flattened['profile.email'] = record.profile.email;
          flattened['profile.full_name'] = `${record.profile.first_name} ${record.profile.last_name}`;
        }
        
        if (record.budget) {
          flattened['budget.id'] = record.budget.id;
          flattened['budget.name'] = record.budget.name;
          flattened['budget.category'] = record.budget.category;
        }
        
        if (record.template) {
          flattened['template.id'] = record.template.id;
          flattened['template.name'] = record.template.name;
          flattened['template.subject'] = record.template.subject;
        }
        
        return flattened;
      });
      
      return processedData;
    },
    enabled: !!tableName,
  });
};
