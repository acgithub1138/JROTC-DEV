import { Task } from '@/hooks/useTasks';
import { SortConfig } from '@/components/ui/sortable-table';

export const useTaskSorting = () => {
  const customSortFn = (a: Task, b: Task, sortConfig: SortConfig) => {
    const getTaskValue = (task: Task, key: string) => {
      if (key === 'assigned_to_name') {
        return task.assigned_to_profile 
          ? `${task.assigned_to_profile.last_name}, ${task.assigned_to_profile.first_name}`
          : '';
      }
      return task[key as keyof Task];
    };

    const aValue = getTaskValue(a, sortConfig.key);
    const bValue = getTaskValue(b, sortConfig.key);

    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const comparison = aValue.localeCompare(bValue);
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    }

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  };

  return { customSortFn };
};