import { useCreateSubtask } from './mutations/useCreateSubtask';
import { useUpdateSubtask } from './mutations/useUpdateSubtask';
import { useDeleteSubtask } from './mutations/useDeleteSubtask';

export const useSubtaskMutations = () => {
  const createSubtaskMutation = useCreateSubtask();
  const updateSubtaskMutation = useUpdateSubtask();
  const deleteSubtaskMutation = useDeleteSubtask();

  return {
    createSubtask: createSubtaskMutation.mutateAsync,
    updateSubtask: updateSubtaskMutation.mutateAsync,
    deleteSubtask: deleteSubtaskMutation.mutateAsync,
    isCreating: createSubtaskMutation.isPending,
    isUpdating: updateSubtaskMutation.isPending,
    isDeleting: deleteSubtaskMutation.isPending,
  };
};