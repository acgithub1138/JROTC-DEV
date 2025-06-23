
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useTaskComments } from '@/hooks/useTaskComments';
import { useTasks } from '@/hooks/useTasks';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';
import { useAuth } from '@/contexts/AuthContext';
import { useTaskStatusOptions, useTaskPriorityOptions } from '@/hooks/useTaskOptions';
import { TaskOverviewCards } from './components/TaskOverviewCards';
import { TaskDescriptionCard } from './components/TaskDescriptionCard';
import { TaskCommentsSection } from './components/TaskCommentsSection';
import { EditableField } from './components/EditableField';
import { TaskDetailProps, EditState } from './types/TaskDetailTypes';

export const TaskDetailDialog: React.FC<TaskDetailProps> = ({ task, open, onOpenChange, onEdit }) => {
  const { userProfile } = useAuth();
  const { updateTask, tasks } = useTasks();
  const { users } = useSchoolUsers();
  const { comments, addComment, isAddingComment } = useTaskComments(task.id);
  const { statusOptions } = useTaskStatusOptions();
  const { priorityOptions } = useTaskPriorityOptions();
  const [editState, setEditState] = useState<EditState>({ field: null, value: null });
  const [currentTask, setCurrentTask] = useState(task);

  // Update currentTask when the task prop changes or when tasks are refetched
  useEffect(() => {
    const updatedTask = tasks.find(t => t.id === task.id);
    if (updatedTask) {
      setCurrentTask(updatedTask);
    } else {
      setCurrentTask(task);
    }
  }, [task, tasks]);

  const canEdit = userProfile?.role === 'instructor' || 
                  userProfile?.role === 'command_staff' || 
                  currentTask.assigned_to === userProfile?.id;

  const startEdit = (field: string, currentValue: any) => {
    setEditState({ field, value: currentValue });
  };

  const cancelEdit = () => {
    setEditState({ field: null, value: null });
  };

  const saveEdit = async (field: string) => {
    if (!editState.field) return;

    const updateData: any = { id: currentTask.id };
    
    if (field === 'due_date') {
      updateData.due_date = editState.value ? editState.value.toISOString() : null;
    } else if (field === 'assigned_to') {
      updateData.assigned_to = editState.value === 'unassigned' ? null : editState.value;
    } else {
      updateData[field] = editState.value;
    }

    try {
      await updateTask(updateData);
      cancelEdit();
      
      // Update the local task state immediately for better UX
      const updatedTask = { ...currentTask, [field]: editState.value };
      setCurrentTask(updatedTask);
      // Remove the onEdit call that triggers the TaskForm modal
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleQuickUpdate = async (field: string, value: any) => {
    const updateData: any = { id: currentTask.id };
    updateData[field] = value;

    try {
      await updateTask(updateData);
      
      // Update the local task state immediately
      const updatedTask = { ...currentTask, [field]: value };
      setCurrentTask(updatedTask);
      // Remove the onEdit call that triggers the TaskForm modal
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const assigneeOptions = [
    { value: 'unassigned', label: 'Unassigned' },
    ...users.map(user => ({
      value: user.id,
      label: `${user.first_name} ${user.last_name}`
    }))
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            <EditableField
              field="title"
              currentValue={currentTask.title}
              displayValue={currentTask.title}
              canEdit={canEdit}
              editState={editState}
              onStartEdit={startEdit}
              onCancelEdit={cancelEdit}
              onSaveEdit={saveEdit}
              onEditStateChange={setEditState}
            />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <TaskOverviewCards
            task={currentTask}
            canEdit={canEdit}
            editState={editState}
            statusOptions={statusOptions}
            priorityOptions={priorityOptions}
            assigneeOptions={assigneeOptions}
            userProfile={userProfile}
            onStartEdit={startEdit}
            onCancelEdit={cancelEdit}
            onSaveEdit={saveEdit}
            onEditStateChange={setEditState}
            onQuickUpdate={handleQuickUpdate}
          />

          <TaskDescriptionCard
            task={currentTask}
            canEdit={canEdit}
            editState={editState}
            onStartEdit={startEdit}
            onCancelEdit={cancelEdit}
            onSaveEdit={saveEdit}
            onEditStateChange={setEditState}
          />

          <Separator />

          <TaskCommentsSection
            comments={comments}
            isAddingComment={isAddingComment}
            onAddComment={addComment}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
