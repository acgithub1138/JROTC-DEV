
import { supabase } from '@/integrations/supabase/client';

// Dynamic type guards that fetch from database
export const isValidTaskStatus = async (value: string): Promise<boolean> => {
  try {
    const { data } = await supabase
      .from('task_status_options')
      .select('value')
      .eq('is_active', true)
      .eq('value', value)
      .single();
    
    return !!data;
  } catch (error) {
    console.error('Error validating task status:', error);
    return false;
  }
};

export const isValidTaskPriority = async (value: string): Promise<boolean> => {
  try {
    const { data } = await supabase
      .from('task_priority_options')
      .select('value')
      .eq('is_active', true)
      .eq('value', value)
      .single();
    
    return !!data;
  } catch (error) {
    console.error('Error validating task priority:', error);
    return false;
  }
};

// Get all valid status values from database
export const getValidTaskStatuses = async (): Promise<string[]> => {
  const { data, error } = await supabase
    .from('task_status_options')
    .select('value')
    .eq('is_active', true)
    .order('sort_order');
  
  if (error) {
    console.error('Error fetching task statuses:', error);
    return ['not_started', 'working_on_it', 'stuck', 'done']; // fallback
  }
  
  return data.map(item => item.value);
};

// Get all valid priority values from database
export const getValidTaskPriorities = async (): Promise<string[]> => {
  const { data, error } = await supabase
    .from('task_priority_options')
    .select('value')
    .eq('is_active', true)
    .order('sort_order');
  
  if (error) {
    console.error('Error fetching task priorities:', error);
    return ['low', 'medium', 'high', 'urgent']; // fallback
  }
  
  return data.map(item => item.value);
};

// Validate task status dynamically
export const validateTaskStatus = async (value: string): Promise<string> => {
  const isValid = await isValidTaskStatus(value);
  if (!isValid) {
    const validValues = await getValidTaskStatuses();
    console.error(`Invalid status value: ${value}. Valid values:`, validValues);
    throw new Error(`Invalid status value: ${value}`);
  }
  return value;
};

// Validate task priority dynamically
export const validateTaskPriority = async (value: string): Promise<string> => {
  const isValid = await isValidTaskPriority(value);
  if (!isValid) {
    const validValues = await getValidTaskPriorities();
    console.error(`Invalid priority value: ${value}. Valid values:`, validValues);
    throw new Error(`Invalid priority value: ${value}`);
  }
  return value;
};

// Synchronous validation using cached values (for form validation)
export const validateTaskStatusSync = (value: string, validStatuses: string[]): string => {
  if (!validStatuses.includes(value)) {
    console.error(`Invalid status value: ${value}. Valid values:`, validStatuses);
    throw new Error(`Invalid status value: ${value}`);
  }
  return value;
};

export const validateTaskPrioritySync = (value: string, validPriorities: string[]): string => {
  if (!validPriorities.includes(value)) {
    console.error(`Invalid priority value: ${value}. Valid values:`, validPriorities);
    throw new Error(`Invalid priority value: ${value}`);
  }
  return value;
};
