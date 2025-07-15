
import { useCreateTask } from './mutations/useCreateTask';
import { useUpdateTask } from './mutations/useUpdateTask';
import { useDeleteTask } from './mutations/useDeleteTask';
import { useDuplicateTask } from './mutations/useDuplicateTask';

export const useTaskMutations = () => {
  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();
  const duplicateTaskMutation = useDuplicateTask();

  return {
    createTask: createTaskMutation.mutate,
    updateTask: updateTaskMutation.mutate,
    deleteTask: deleteTaskMutation.mutate,
    duplicateTask: duplicateTaskMutation.mutate,
    isCreating: createTaskMutation.isPending,
    isUpdating: updateTaskMutation.isPending,
    isDeleting: deleteTaskMutation.isPending,
    isDuplicating: duplicateTaskMutation.isPending,
  };
};
