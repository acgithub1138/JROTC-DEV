
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTasks, Task } from '@/hooks/useTasks';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';
import { useTaskStatusOptions, useTaskPriorityOptions } from '@/hooks/useTaskOptions';
import { useTaskPermissions } from '@/hooks/useModuleSpecificPermissions';

interface EditState {
  taskId: string | null;
  field: string | null;
  value: any;
}

export const useTaskTableLogic = () => {
  const { userProfile } = useAuth();
  const { updateTask, deleteTask } = useTasks();
  const { users } = useSchoolUsers();
  const { statusOptions } = useTaskStatusOptions();
  const { priorityOptions } = useTaskPriorityOptions();
  const { canUpdate, canDelete, canUpdateAssigned } = useTaskPermissions();
  const [editState, setEditState] = useState<EditState>({ taskId: null, field: null, value: null });
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

  const canEdit = canUpdate;

  const handleSelectTask = (taskId: string, checked: boolean) => {
    if (checked) {
      setSelectedTasks([...selectedTasks, taskId]);
    } else {
      setSelectedTasks(selectedTasks.filter(id => id !== taskId));
    }
  };

  const handleSelectAll = (checked: boolean, tasks: Task[]) => {
    if (checked) {
      setSelectedTasks(tasks.map(task => task.id));
    } else {
      setSelectedTasks([]);
    }
  };

  const handleBulkDelete = () => {
    if (selectedTasks.length === 0 || !canDelete) return;
    
    const confirmMessage = `Are you sure you want to delete ${selectedTasks.length} task${selectedTasks.length > 1 ? 's' : ''}?`;
    if (confirm(confirmMessage)) {
      selectedTasks.forEach(taskId => {
        deleteTask(taskId);
      });
      setSelectedTasks([]);
    }
  };

  const cancelEdit = () => {
    setEditState({ taskId: null, field: null, value: null });
  };

  const saveEdit = async (task: Task, field: string, newValue: any, onSystemComment?: (taskId: string, commentText: string) => void) => {
    console.log('Saving task update:', { taskId: task.id, field, newValue });

    // Get the old value for comparison
    const oldValue = task[field as keyof Task];

    // Skip if values are the same
    if (oldValue === newValue) {
      cancelEdit();
      return;
    }

    const updateData: any = { id: task.id };
    
    // Use the newValue parameter directly instead of editState.value
    if (field === 'due_date') {
      updateData.due_date = newValue ? newValue.toISOString() : null;
    } else {
      updateData[field] = newValue;
    }

    console.log('Final update data:', updateData);

    try {
      await updateTask(updateData);
      
      // Add system comment for tracked fields if callback is provided
      const trackedFields = ['status', 'priority', 'assigned_to', 'due_date'];
      if (trackedFields.includes(field) && onSystemComment) {
        const { formatFieldChangeComment } = await import('@/utils/taskCommentUtils');
        const commentText = formatFieldChangeComment(
          field,
          oldValue,
          newValue,
          statusOptions,
          priorityOptions,
          users
        );
        onSystemComment(task.id, commentText);
      }
      
      cancelEdit();
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const canEditTask = (task: Task) => {
    return canUpdate || (canUpdateAssigned && task.assigned_to === userProfile?.id);
  };

  return {
    editState,
    setEditState,
    selectedTasks,
    canEdit,
    users,
    statusOptions,
    priorityOptions,
    handleSelectTask,
    handleSelectAll,
    handleBulkDelete,
    cancelEdit,
    saveEdit,
    canEditTask,
  };
};
