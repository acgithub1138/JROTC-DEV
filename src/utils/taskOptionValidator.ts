
import { supabase } from '@/integrations/supabase/client';

// Default options that should exist in the database
const DEFAULT_STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not Started', color_class: 'bg-gray-100 text-gray-800', sort_order: 1 },
  { value: 'working_on_it', label: 'Working on it', color_class: 'bg-blue-100 text-blue-800', sort_order: 2 },
  { value: 'stuck', label: 'Stuck', color_class: 'bg-red-100 text-red-800', sort_order: 3 },
  { value: 'done', label: 'Done', color_class: 'bg-green-100 text-green-800', sort_order: 4 },
];

const DEFAULT_PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color_class: 'bg-green-100 text-green-800', sort_order: 1 },
  { value: 'medium', label: 'Medium', color_class: 'bg-yellow-100 text-yellow-800', sort_order: 2 },
  { value: 'high', label: 'High', color_class: 'bg-orange-100 text-orange-800', sort_order: 3 },
  { value: 'urgent', label: 'Urgent', color_class: 'bg-red-100 text-red-800', sort_order: 4 },
];

export interface ValidationResult {
  isValid: boolean;
  missingStatuses: string[];
  missingPriorities: string[];
  extraStatuses: string[];
  extraPriorities: string[];
}

export const validateTaskOptions = async (): Promise<ValidationResult> => {
  try {
    // Get current database options
    const { data: statusOptions } = await supabase
      .from('task_status_options')
      .select('value')
      .eq('is_active', true);

    const { data: priorityOptions } = await supabase
      .from('task_priority_options')
      .select('value')
      .eq('is_active', true);

    const dbStatusValues = new Set(statusOptions?.map(opt => opt.value) || []);
    const dbPriorityValues = new Set(priorityOptions?.map(opt => opt.value) || []);
    
    const defaultStatusValues = new Set(DEFAULT_STATUS_OPTIONS.map(opt => opt.value));
    const defaultPriorityValues = new Set(DEFAULT_PRIORITY_OPTIONS.map(opt => opt.value));

    // Find missing options (in defaults but not in database)
    const missingStatuses = Array.from(defaultStatusValues).filter(
      status => !dbStatusValues.has(status)
    );
    
    const missingPriorities = Array.from(defaultPriorityValues).filter(
      priority => !dbPriorityValues.has(priority)
    );

    // Find extra options (in database but not in defaults)
    const extraStatuses = Array.from(dbStatusValues).filter(
      status => !defaultStatusValues.has(status)
    );
    
    const extraPriorities = Array.from(dbPriorityValues).filter(
      priority => !defaultPriorityValues.has(priority)
    );

    const isValid = missingStatuses.length === 0 && 
                   missingPriorities.length === 0 && 
                   extraStatuses.length === 0 && 
                   extraPriorities.length === 0;

    return {
      isValid,
      missingStatuses,
      missingPriorities,
      extraStatuses,
      extraPriorities
    };
  } catch (error) {
    console.error('Error validating task options:', error);
    return {
      isValid: false,
      missingStatuses: [],
      missingPriorities: [],
      extraStatuses: [],
      extraPriorities: []
    };
  }
};

export const syncTaskOptions = async (): Promise<void> => {
  const validation = await validateTaskOptions();
  
  if (validation.isValid) {
    console.log('Task options are already in sync');
    return;
  }

  console.log('Syncing task options...', validation);

  // Add missing status options
  for (const statusValue of validation.missingStatuses) {
    const config = DEFAULT_STATUS_OPTIONS.find(opt => opt.value === statusValue);
    if (config) {
      const { error } = await supabase
        .from('task_status_options')
        .insert({
          value: config.value,
          label: config.label,
          color_class: config.color_class,
          sort_order: config.sort_order,
          is_active: true
        });

      if (error) {
        console.error(`Error adding status option ${statusValue}:`, error);
      } else {
        console.log(`Added status option: ${config.label}`);
      }
    }
  }

  // Add missing priority options
  for (const priorityValue of validation.missingPriorities) {
    const config = DEFAULT_PRIORITY_OPTIONS.find(opt => opt.value === priorityValue);
    if (config) {
      const { error } = await supabase
        .from('task_priority_options')
        .insert({
          value: config.value,
          label: config.label,
          color_class: config.color_class,
          sort_order: config.sort_order,
          is_active: true
        });

      if (error) {
        console.error(`Error adding priority option ${priorityValue}:`, error);
      } else {
        console.log(`Added priority option: ${config.label}`);
      }
    }
  }

  console.log('Task options sync completed');
};
