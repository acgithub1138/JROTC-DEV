
import { useCreateTask } from './mutations/useCreateTask';
import { useUpdateTask } from './mutations/useUpdateTask';
import { useDeleteTask } from './mutations/useDeleteTask';

export const useTaskMutations = () => {
  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();

  return {
    createTask: createTaskMutation.mutate,
    updateTask: updateTaskMutation.mutate,
    deleteTask: deleteTaskMutation.mutate,
    isCreating: createTaskMutation.isPending,
    isUpdating: updateTaskMutation.isPending,
    isDeleting: deleteTaskMutation.isPending,
  };
};
