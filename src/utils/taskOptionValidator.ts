
import { supabase } from '@/integrations/supabase/client';
import { 
  TASK_STATUS_CONFIG, 
  TASK_PRIORITY_CONFIG, 
  TaskStatus, 
  TaskPriority 
} from '@/config/taskOptions';

export interface ValidationResult {
  isValid: boolean;
  missingStatuses: TaskStatus[];
  missingPriorities: TaskPriority[];
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
    
    const configStatusValues = new Set(Object.keys(TASK_STATUS_CONFIG));
    const configPriorityValues = new Set(Object.keys(TASK_PRIORITY_CONFIG));

    // Find missing options (in config but not in database)
    const missingStatuses = Array.from(configStatusValues).filter(
      status => !dbStatusValues.has(status)
    ) as TaskStatus[];
    
    const missingPriorities = Array.from(configPriorityValues).filter(
      priority => !dbPriorityValues.has(priority)
    ) as TaskPriority[];

    // Find extra options (in database but not in config)
    const extraStatuses = Array.from(dbStatusValues).filter(
      status => !configStatusValues.has(status)
    );
    
    const extraPriorities = Array.from(dbPriorityValues).filter(
      priority => !configPriorityValues.has(priority)
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
    const config = TASK_STATUS_CONFIG[statusValue];
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

  // Add missing priority options
  for (const priorityValue of validation.missingPriorities) {
    const config = TASK_PRIORITY_CONFIG[priorityValue];
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

  console.log('Task options sync completed');
};
