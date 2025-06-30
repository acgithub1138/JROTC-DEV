
import { TaskStatus, TaskPriority, getTaskStatusValues, getTaskPriorityValues } from '@/config/taskOptions';

export const validateTaskStatus = (value: string): TaskStatus => {
  const validValues = getTaskStatusValues();
  if (!validValues.includes(value as TaskStatus)) {
    console.error(`Invalid status value: ${value}. Valid values:`, validValues);
    throw new Error(`Invalid status value: ${value}`);
  }
  return value as TaskStatus;
};

export const validateTaskPriority = (value: string): TaskPriority => {
  const validValues = getTaskPriorityValues();
  if (!validValues.includes(value as TaskPriority)) {
    console.error(`Invalid priority value: ${value}. Valid values:`, validValues);
    throw new Error(`Invalid priority value: ${value}`);
  }
  return value as TaskPriority;
};
