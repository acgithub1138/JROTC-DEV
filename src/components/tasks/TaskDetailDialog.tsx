
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Check } from 'lucide-react';
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
import { formatFieldChangeComment } from '@/utils/taskCommentUtils';

export const TaskDetailDialog: React.FC<TaskDetailProps> = ({ task, open, onOpenChange, onEdit }) => {
  const { userProfile } = useAuth();
  const { updateTask, tasks } = useTasks();
  const { users } = useSchoolUsers();
  const { comments, addComment, addSystemComment, isAddingComment } = useTaskComments(task.id);
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

    const oldValue = currentTask[field as keyof typeof currentTask];
    const newValue = editState.value;

    // Skip if values are the same
    if (oldValue === newValue) {
      cancelEdit();
      return;
    }

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
      
      // Add system comment for tracked fields
      const trackedFields = ['status', 'priority', 'assigned_to', 'description', 'due_date'];
      if (trackedFields.includes(field)) {
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
      
      // Update the local task state immediately for better UX
      const updatedTask = { ...currentTask, [field]: editState.value };
      setCurrentTask(updatedTask);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleQuickUpdate = async (field: string, value: any) => {
    const oldValue = currentTask[field as keyof typeof currentTask];

    // Skip if values are the same
    if (oldValue === value) {
      return;
    }

    const updateData: any = { id: currentTask.id };
    updateData[field] = value;

    try {
      await updateTask(updateData);
      
      // Add system comment for tracked fields
      const trackedFields = ['status', 'priority', 'assigned_to', 'due_date'];
      if (trackedFields.includes(field)) {
        const commentText = formatFieldChangeComment(
          field,
          oldValue,
          value,
          statusOptions,
          priorityOptions,
          users
        );
        addSystemComment(commentText);
      }
      
      // Update the local task state immediately
      const updatedTask = { ...currentTask, [field]: value };
      setCurrentTask(updatedTask);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const assigneeOptions = [
    { value: 'unassigned', label: 'Unassigned' },
    ...users.map(user => ({
      value: user.id,
      label: `${user.last_name}, ${user.first_name}`
    }))
  ];

  const handleCompleteTask = async () => {
    await updateTask({ 
      id: currentTask.id, 
      status: 'done',
      completed_at: new Date().toISOString()
    });
    
    // Add system comment
    addSystemComment('Task completed');
    
    onOpenChange(false);
  };

  const getDialogTitle = () => {
    if (currentTask.task_number) {
      return `${currentTask.task_number} - ${currentTask.title}`;
    }
    return currentTask.title;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">
              {currentTask.task_number && (
                <span className="text-blue-600 font-mono mr-2">
                  {currentTask.task_number} -
                </span>
              )}
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
            {currentTask.status !== 'done' && (
              <Button
                type="button"
                onClick={handleCompleteTask}
                className="flex items-center gap-2"
                variant="default"
              >
                <Check className="w-4 h-4" />
                Complete
              </Button>
            )}
          </div>
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
