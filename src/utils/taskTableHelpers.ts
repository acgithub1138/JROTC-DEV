
import { TaskStatusOption, TaskPriorityOption } from '@/hooks/useTaskOptions';

export const getStatusLabel = (statusValue: string, statusOptions: TaskStatusOption[]) => {
  const option = statusOptions.find(opt => opt.value === statusValue);
  return option ? option.label : statusValue.replace('_', ' ');
};

export const getPriorityLabel = (priorityValue: string, priorityOptions: TaskPriorityOption[]) => {
  const option = priorityOptions.find(opt => opt.value === priorityValue);
  return option ? option.label : priorityValue;
};

export const getStatusColorClass = (statusValue: string, statusOptions: TaskStatusOption[]) => {
  const option = statusOptions.find(opt => opt.value === statusValue);
  return option ? option.color_class : 'bg-gray-100 text-gray-800';
};

export const getPriorityColorClass = (priorityValue: string, priorityOptions: TaskPriorityOption[]) => {
  const option = priorityOptions.find(opt => opt.value === priorityValue);
  return option ? option.color_class : 'bg-gray-100 text-gray-800';
};
