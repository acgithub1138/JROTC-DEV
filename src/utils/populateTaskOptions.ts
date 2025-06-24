
import { supabase } from '@/integrations/supabase/client';
import { getStatusOptionsForDatabase, getPriorityOptionsForDatabase } from '@/config/taskOptions';

export const populateTaskOptions = async () => {
  const statusOptions = getStatusOptionsForDatabase();
  const priorityOptions = getPriorityOptionsForDatabase();

  try {
    // Check and add missing status options
    for (const option of statusOptions) {
      const { data: existing } = await supabase
        .from('task_status_options')
        .select('id')
        .eq('value', option.value)
        .single();

      if (!existing) {
        const { error } = await supabase
          .from('task_status_options')
          .insert({
            value: option.value,
            label: option.label,
            color_class: option.color_class,
            sort_order: option.sort_order,
            is_active: true
          });

        if (error) {
          console.error(`Error adding status option ${option.value}:`, error);
        } else {
          console.log(`Added status option: ${option.label}`);
        }
      }
    }

    // Check and add missing priority options
    for (const option of priorityOptions) {
      const { data: existing } = await supabase
        .from('task_priority_options')
        .select('id')
        .eq('value', option.value)
        .single();

      if (!existing) {
        const { error } = await supabase
          .from('task_priority_options')
          .insert({
            value: option.value,
            label: option.label,
            color_class: option.color_class,
            sort_order: option.sort_order,
            is_active: true
          });

        if (error) {
          console.error(`Error adding priority option ${option.value}:`, error);
        } else {
          console.log(`Added priority option: ${option.label}`);
        }
      }
    }

    console.log('Task options population completed');
  } catch (error) {
    console.error('Error populating task options:', error);
  }
};
