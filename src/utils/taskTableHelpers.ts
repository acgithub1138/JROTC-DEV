
import { TaskStatusOption, TaskPriorityOption } from '@/hooks/useTaskOptions';
import { getStatusConfig, getPriorityConfig, TaskStatus, TaskPriority } from '@/config/taskOptions';

export const getStatusLabel = (statusValue: string, statusOptions: TaskStatusOption[]) => {
  // First try to get from database options
  const option = statusOptions.find(opt => opt.value === statusValue);
  if (option) return option.label;
  
  // Fallback to centralized config
  const config = getStatusConfig(statusValue as TaskStatus);
  return config ? config.label : statusValue.replace('_', ' ');
};

export const getPriorityLabel = (priorityValue: string, priorityOptions: TaskPriorityOption[]) => {
  // First try to get from database options
  const option = priorityOptions.find(opt => opt.value === priorityValue);
  if (option) return option.label;
  
  // Fallback to centralized config
  const config = getPriorityConfig(priorityValue as TaskPriority);
  return config ? config.label : priorityValue;
};

export const getStatusColorClass = (statusValue: string, statusOptions: TaskStatusOption[]) => {
  // First try to get from database options
  const option = statusOptions.find(opt => opt.value === statusValue);
  if (option) return option.color_class;
  
  // Fallback to centralized config
  const config = getStatusConfig(statusValue as TaskStatus);
  return config ? config.color_class : 'bg-gray-100 text-gray-800';
};

export const getPriorityColorClass = (priorityValue: string, priorityOptions: TaskPriorityOption[]) => {
  // First try to get from database options
  const option = priorityOptions.find(opt => opt.value === priorityValue);
  if (option) return option.color_class;
  
  // Fallback to centralized config
  const config = getPriorityConfig(priorityValue as TaskPriority);
  return config ? config.color_class : 'bg-gray-100 text-gray-800';
};
