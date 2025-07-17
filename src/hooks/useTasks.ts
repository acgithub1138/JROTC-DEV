
import { useTasksQuery } from './tasks/useTasksQuery';
import { useTaskMutations } from './tasks/useTaskMutations';

export const useTasks = () => {
  const { data: tasks = [], isLoading, refetch } = useTasksQuery();
  const mutations = useTaskMutations();

  return {
    tasks,
    isLoading,
    refetch,
    ...mutations,
  };
};

// Re-export types for backward compatibility
export type { Task, TaskComment } from './tasks/types';
