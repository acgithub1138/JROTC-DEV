import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { useAuth } from '@/contexts/AuthContext';
import { Task } from '@/hooks/useTasks';
import { useTaskForm } from './hooks/useTaskForm';
import { TaskTitleField } from './fields/TaskTitleField';
import { TaskAssigneeField } from './fields/TaskAssigneeField';
import { TaskDescriptionField } from './fields/TaskDescriptionField';
import { TaskPriorityStatusFields } from './fields/TaskPriorityStatusFields';
import { TaskDueDateField } from './fields/TaskDueDateField';
import { useTaskPermissions } from '@/hooks/useModuleSpecificPermissions';
import { AttachmentSection } from '@/components/attachments/AttachmentSection';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';

interface TaskFormContentProps {
  mode: 'create' | 'edit';
  task?: Task;
  onSuccess?: () => void;
  onCancel?: () => void;
  showAttachments?: boolean;
  onTaskCreated?: (task: Task) => void;
}

export const TaskFormContent: React.FC<TaskFormContentProps> = ({
  mode,
  task,
  onSuccess,
  onCancel,
  showAttachments = true,
  onTaskCreated
}) => {
  const { userProfile } = useAuth();
  const { canAssign, canUpdate, canUpdateAssigned } = useTaskPermissions();
  const canAssignTasks = canAssign;
  const canEditThisTask = canUpdate || (canUpdateAssigned && task?.assigned_to === userProfile?.id);
  
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const {
    form,
    onSubmit,
    onError,
    isSubmitting,
    isLoading,
    statusOptions,
    priorityOptions
  } = useTaskForm({
    mode,
    task,
    onOpenChange: () => {}, // Not used in page context
    canAssignTasks,
    currentUserId: userProfile?.id || '',
    onTaskCreated: (newTask: Task) => {
      setHasUnsavedChanges(false);
      if (onTaskCreated) {
        onTaskCreated(newTask);
      } else if (onSuccess) {
        onSuccess();
      }
    }
  });

  // Track form changes for unsaved warning
  useEffect(() => {
    const subscription = form.watch((value) => {
      const hasChanges = mode === 'create' 
        ? !!(value.title || value.description || value.assigned_to || (value.due_date && value.due_date.getTime() > 0))
        : !!(
          value.title !== (task?.title || '') ||
          value.description !== (task?.description || '') ||
          value.assigned_to !== (task?.assigned_to || '') ||
          value.priority !== (task?.priority || 'medium') ||
          value.status !== (task?.status || 'not_started') ||
          (value.due_date?.getTime() || null) !== (task?.due_date ? new Date(task.due_date).getTime() : null)
        );
      setHasUnsavedChanges(hasChanges);
    });
    return () => subscription.unsubscribe();
  }, [form, mode, task]);

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowConfirmDialog(true);
    } else if (onCancel) {
      onCancel();
    }
  };

  const confirmCancel = () => {
    setShowConfirmDialog(false);
    form.reset();
    if (onCancel) {
      onCancel();
    }
  };

  const cancelConfirm = () => {
    setShowConfirmDialog(false);
  };

  const handleSubmit = async (data: any) => {
    await onSubmit(data);
    if (onSuccess && mode === 'edit') {
      onSuccess();
    }
  };

  const isEditingAssignedTask = mode === 'edit' && task?.assigned_to === userProfile?.id;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="text-center">Loading task options...</div>
      </div>
    );
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit, onError)} className="space-y-6">
          <TaskTitleField form={form} />
          
          <TaskAssigneeField form={form} canAssignTasks={canAssignTasks} canEditThisTask={canEditThisTask} />
          
          <TaskDescriptionField form={form} />
          
          <TaskPriorityStatusFields 
            form={form} 
            canAssignTasks={canAssignTasks} 
            canEditThisTask={canEditThisTask} 
            isEditingAssignedTask={isEditingAssignedTask} 
            statusOptions={statusOptions} 
            priorityOptions={priorityOptions} 
          />
          
          <TaskDueDateField form={form} />

          {mode === 'edit' && task?.id && showAttachments && (
            <AttachmentSection
              recordType="task"
              recordId={task.id}
              canEdit={canEditThisTask}
              defaultOpen={false}
            />
          )}

          <div className="flex justify-end gap-2 pt-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {mode === 'create' ? 'Create Task' : 'Update Task'}
            </Button>
          </div>
        </form>
      </Form>

      <UnsavedChangesDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onDiscard={confirmCancel}
        onCancel={cancelConfirm}
        title="Unsaved Changes"
        description="You have unsaved changes. Are you sure you want to discard them?"
      />
    </>
  );
};