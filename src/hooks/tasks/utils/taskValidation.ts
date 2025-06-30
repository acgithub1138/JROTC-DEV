
import { TaskStatus, TaskPriority, getTaskStatusValues, getTaskPriorityValues } from '@/config/taskOptions';

// Type guard for TaskStatus with proper type narrowing
export const isValidTaskStatus = (value: string): value is TaskStatus => {
  return (getTaskStatusValues() as readonly string[]).includes(value);
};

// Type guard for TaskPriority with proper type narrowing  
export const isValidTaskPriority = (value: string): value is TaskPriority => {
  return (getTaskPriorityValues() as readonly string[]).includes(value);
};

export const validateTaskStatus = (value: string): TaskStatus => {
  if (!isValidTaskStatus(value)) {
    console.error(`Invalid status value: ${value}. Valid values:`, getTaskStatusValues());
    throw new Error(`Invalid status value: ${value}`);
  }
  // Now TypeScript knows this is a TaskStatus literal type
  return value;
};

export const validateTaskPriority = (value: string): TaskPriority => {
  if (!isValidTaskPriority(value)) {
    console.error(`Invalid priority value: ${value}. Valid values:`, getTaskPriorityValues());
    throw new Error(`Invalid priority value: ${value}`);
  }
  // Now TypeScript knows this is a TaskPriority literal type
  return value;
};
