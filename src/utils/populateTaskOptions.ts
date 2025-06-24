
import { supabase } from '@/integrations/supabase/client';

export const populateTaskOptions = async () => {
  // Status options to add
  const statusOptions = [
    { value: 'pending', label: 'Pending', color_class: 'bg-yellow-100 text-yellow-800', sort_order: 5 },
    { value: 'in_progress', label: 'In Progress', color_class: 'bg-blue-100 text-blue-800', sort_order: 6 },
    { value: 'completed', label: 'Completed', color_class: 'bg-green-100 text-green-800', sort_order: 7 },
    { value: 'overdue', label: 'Overdue', color_class: 'bg-red-100 text-red-800', sort_order: 8 },
    { value: 'canceled', label: 'Canceled', color_class: 'bg-gray-100 text-gray-800', sort_order: 9 },
  ];

  // Priority options to add
  const priorityOptions = [
    { value: 'urgent', label: 'Urgent', color_class: 'bg-orange-100 text-orange-800', sort_order: 4 },
  ];

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
          .insert(option);

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
          .insert(option);

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
