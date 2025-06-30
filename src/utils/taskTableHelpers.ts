
import { TaskStatusOption, TaskPriorityOption } from '@/hooks/useTaskOptions';

export const getStatusLabel = (statusValue: string, statusOptions: TaskStatusOption[]) => {
  // Get from database options
  const option = statusOptions.find(opt => opt.value === statusValue);
  if (option) return option.label;
  
  // Fallback to formatted value
  return statusValue.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export const getPriorityLabel = (priorityValue: string, priorityOptions: TaskPriorityOption[]) => {
  // Get from database options
  const option = priorityOptions.find(opt => opt.value === priorityValue);
  if (option) return option.label;
  
  // Fallback to capitalized value
  return priorityValue.charAt(0).toUpperCase() + priorityValue.slice(1);
};

export const getStatusColorClass = (statusValue: string, statusOptions: TaskStatusOption[]) => {
  // Get from database options
  const option = statusOptions.find(opt => opt.value === statusValue);
  if (option) return option.color_class;
  
  // Fallback color
  return 'bg-gray-100 text-gray-800';
};

export const getPriorityColorClass = (priorityValue: string, priorityOptions: TaskPriorityOption[]) => {
  // Get from database options
  const option = priorityOptions.find(opt => opt.value === priorityValue);
  if (option) return option.color_class;
  
  // Fallback color
  return 'bg-gray-100 text-gray-800';
};
