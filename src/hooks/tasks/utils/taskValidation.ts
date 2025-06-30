
import { TaskStatus, TaskPriority, getTaskStatusValues, getTaskPriorityValues } from '@/config/taskOptions';

// Type guard for TaskStatus
export const isValidTaskStatus = (value: string): value is TaskStatus => {
  const validValues = getTaskStatusValues();
  return validValues.includes(value as TaskStatus);
};

// Type guard for TaskPriority  
export const isValidTaskPriority = (value: string): value is TaskPriority => {
  const validValues = getTaskPriorityValues();
  return validValues.includes(value as TaskPriority);
};

export const validateTaskStatus = (value: string): TaskStatus => {
  if (!isValidTaskStatus(value)) {
    console.error(`Invalid status value: ${value}. Valid values:`, getTaskStatusValues());
    throw new Error(`Invalid status value: ${value}`);
  }
  return value;
};

export const validateTaskPriority = (value: string): TaskPriority => {
  if (!isValidTaskPriority(value)) {
    console.error(`Invalid priority value: ${value}. Valid values:`, getTaskPriorityValues());
    throw new Error(`Invalid priority value: ${value}`);
  }
  return value;
};
