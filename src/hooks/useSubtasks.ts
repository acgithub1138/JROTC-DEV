import { useSubtasksQuery } from './subtasks/useSubtasksQuery';
import { useSubtaskMutations } from './subtasks/useSubtaskMutations';

export const useSubtasks = (parentTaskId?: string) => {
  const { data: subtasks = [], isLoading } = useSubtasksQuery(parentTaskId);
  const mutations = useSubtaskMutations();

  return {
    subtasks,
    isLoading,
    ...mutations,
  };
};

// Re-export types for backward compatibility
export type { Subtask, CreateSubtaskData } from './tasks/types';