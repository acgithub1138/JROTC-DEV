import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { Task } from '@/hooks/useTasks';
import { useTaskForm } from './forms/hooks/useTaskForm';
import { TaskTitleField } from './forms/fields/TaskTitleField';
import { TaskAssigneeField } from './forms/fields/TaskAssigneeField';
import { TaskDescriptionField } from './forms/fields/TaskDescriptionField';
import { TaskPriorityStatusFields } from './forms/fields/TaskPriorityStatusFields';
import { TaskDueDateField } from './forms/fields/TaskDueDateField';
import { useTaskPermissions } from '@/hooks/useModuleSpecificPermissions';
import { AttachmentSection } from '@/components/attachments/AttachmentSection';
interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  task?: Task;
}
export const TaskForm: React.FC<TaskFormProps> = ({
  open,
  onOpenChange,
  mode,
  task
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
    onOpenChange,
    canAssignTasks,
    currentUserId: userProfile?.id || ''
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

  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowConfirmDialog(true);
    } else {
      onOpenChange(false);
    }
  };

  const confirmClose = () => {
    setShowConfirmDialog(false);
    form.reset();
    onOpenChange(false);
  };

  const cancelClose = () => {
    setShowConfirmDialog(false);
  };
  const isEditingAssignedTask = mode === 'edit' && task?.assigned_to === userProfile?.id;
  const getDialogTitle = () => {
    if (mode === 'create') {
      return 'Create New Task';
    }
    if (task?.task_number) {
      return `${task.task_number} - ${task.title}`;
    }
    return `Edit Task - ${task.title}`;
  };
  if (isLoading) {
    return <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <div className="flex items-center justify-center p-6">
            <div className="text-center">Loading task options...</div>
          </div>
        </DialogContent>
      </Dialog>;
  }
  return (
    <>
      <Dialog open={open} onOpenChange={hasUnsavedChanges ? handleClose : onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {getDialogTitle()}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' ? 'Fill in the details to create a new task.' : 'Update the task details below.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-4">
            <TaskTitleField form={form} />
            
            <TaskAssigneeField form={form} canAssignTasks={canAssignTasks} canEditThisTask={canEditThisTask} />
            
            <TaskDescriptionField form={form} />
            
            <TaskPriorityStatusFields form={form} canAssignTasks={canAssignTasks} canEditThisTask={canEditThisTask} isEditingAssignedTask={isEditingAssignedTask} statusOptions={statusOptions} priorityOptions={priorityOptions} />
            
            <TaskDueDateField form={form} />

            {mode === 'edit' && task?.id && (
              <AttachmentSection
                recordType="task"
                recordId={task.id}
                canEdit={canEditThisTask}
                defaultOpen={false}
              />
            )}

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {mode === 'create' ? 'Create Task' : 'Update Task'}
              </Button>
            </div>
          </form>
        </Form>
        </DialogContent>
      </Dialog>

      {/* Unsaved Changes Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to close without saving?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelClose}>Stay</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClose}>Discard Changes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};