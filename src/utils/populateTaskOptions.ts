
import { supabase } from '@/integrations/supabase/client';

// Default task options that will be inserted if they don't exist
const DEFAULT_STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not Started', color_class: 'bg-gray-100 text-gray-800', sort_order: 1 },
  { value: 'working_on_it', label: 'Working on it', color_class: 'bg-blue-100 text-blue-800', sort_order: 2 },
  { value: 'stuck', label: 'Stuck', color_class: 'bg-red-100 text-red-800', sort_order: 3 },
  { value: 'done', label: 'Done', color_class: 'bg-green-100 text-green-800', sort_order: 4 },
  { value: 'canceled', label: 'Canceled', color_class: 'bg-gray-100 text-gray-800', sort_order: 5 },
  { value: 'overdue', label: 'Overdue', color_class: 'bg-orange-100 text-orange-800', sort_order: 6 },
];

const DEFAULT_PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color_class: 'bg-green-100 text-green-800', sort_order: 1 },
  { value: 'medium', label: 'Medium', color_class: 'bg-yellow-100 text-yellow-800', sort_order: 2 },
  { value: 'high', label: 'High', color_class: 'bg-orange-100 text-orange-800', sort_order: 3 },
  { value: 'urgent', label: 'Urgent', color_class: 'bg-red-100 text-red-800', sort_order: 4 },
  { value: 'critical', label: 'Critical', color_class: 'bg-purple-100 text-purple-800', sort_order: 5 },
];

export const populateTaskOptions = async () => {
  try {
    console.log('Populating task options...');
    
    // Populate status options
    for (const statusOption of DEFAULT_STATUS_OPTIONS) {
      const { data: existing } = await supabase
        .from('task_status_options')
        .select('id')
        .eq('value', statusOption.value)
        .single();
      
      if (!existing) {
        const { error } = await supabase
          .from('task_status_options')
          .insert({
            ...statusOption,
            is_active: true,
          });
        
        if (error) {
          console.error(`Error inserting status option ${statusOption.value}:`, error);
        } else {
          console.log(`Inserted status option: ${statusOption.label}`);
        }
      }
    }
    
    // Populate priority options
    for (const priorityOption of DEFAULT_PRIORITY_OPTIONS) {
      const { data: existing } = await supabase
        .from('task_priority_options')
        .select('id')
        .eq('value', priorityOption.value)
        .single();
      
      if (!existing) {
        const { error } = await supabase
          .from('task_priority_options')
          .insert({
            ...priorityOption,
            is_active: true,
          });
        
        if (error) {
          console.error(`Error inserting priority option ${priorityOption.value}:`, error);
        } else {
          console.log(`Inserted priority option: ${priorityOption.label}`);
        }
      }
    }
    
    console.log('Task options population completed');
  } catch (error) {
    console.error('Error populating task options:', error);
  }
};
