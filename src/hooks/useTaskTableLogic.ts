
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTasks, Task } from '@/hooks/useTasks';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';
import { useTaskStatusOptions, useTaskPriorityOptions } from '@/hooks/useTaskOptions';
import { useTaskComments } from '@/hooks/useTaskComments';
import { formatFieldChangeComment } from '@/utils/taskCommentUtils';

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
  const [editState, setEditState] = useState<EditState>({ taskId: null, field: null, value: null });
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

  const canEdit = userProfile?.role === 'instructor' || userProfile?.role === 'command_staff';

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
    if (selectedTasks.length === 0) return;
    
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

  const saveEdit = async (task: Task, field: string, newValue: any) => {
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
      
      // Add system comment for tracked fields
      const trackedFields = ['status', 'priority', 'assigned_to'];
      if (trackedFields.includes(field)) {
        const { addSystemComment } = useTaskComments(task.id);
        const commentText = formatFieldChangeComment(
          field,
          oldValue,
          newValue,
          statusOptions,
          priorityOptions,
          users
        );
        addSystemComment(commentText);
      }
      
      cancelEdit();
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const canEditTask = (task: Task) => {
    return canEdit || task.assigned_to === userProfile?.id;
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
