import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ArrowLeft, Save, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Task } from '@/hooks/useTasks';
import { useTaskForm } from '@/components/tasks/forms/hooks/useTaskForm';
import { TaskTitleField } from '@/components/tasks/forms/fields/TaskTitleField';
import { TaskAssigneeField } from '@/components/tasks/forms/fields/TaskAssigneeField';
import { TaskDescriptionField } from '@/components/tasks/forms/fields/TaskDescriptionField';
import { TaskPriorityStatusFields } from '@/components/tasks/forms/fields/TaskPriorityStatusFields';
import { TaskDueDateField } from '@/components/tasks/forms/fields/TaskDueDateField';
import { useTaskPermissions } from '@/hooks/useModuleSpecificPermissions';

interface MobileTaskFormProps {
  task: Task;
  onCancel: () => void;
  onSuccess: () => void;
}

export const MobileTaskForm: React.FC<MobileTaskFormProps> = ({
  task,
  onCancel,
  onSuccess
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
    mode: 'edit',
    task,
    onOpenChange: (open) => {
      if (!open) {
        onSuccess();
      }
    },
    canAssignTasks,
    currentUserId: userProfile?.id || ''
  });

  // Track form changes for unsaved warning
  useEffect(() => {
    const subscription = form.watch((value) => {
      const hasChanges = !!(
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
  }, [form, task]);

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowConfirmDialog(true);
    } else {
      onCancel();
    }
  };

  const confirmCancel = () => {
    setShowConfirmDialog(false);
    form.reset();
    onCancel();
  };

  const cancelConfirm = () => {
    setShowConfirmDialog(false);
  };

  const isEditingAssignedTask = task?.assigned_to === userProfile?.id;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-1 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="mr-2 p-2 flex-shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-semibold truncate">
                  Edit Task
                  {task.task_number && ` - ${task.task_number}`}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                type="submit"
                form="task-edit-form"
                disabled={isSubmitting}
                size="sm"
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-4 pb-20">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Edit Task Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form 
                  id="task-edit-form"
                  onSubmit={form.handleSubmit(onSubmit, onError)} 
                  className="space-y-4"
                >
                  <TaskTitleField form={form} />
                  
                  <TaskAssigneeField 
                    form={form} 
                    canAssignTasks={canAssignTasks} 
                    canEditThisTask={canEditThisTask} 
                  />
                  
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
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Unsaved Changes Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to cancel without saving?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelConfirm}>Stay</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancel}>Discard Changes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};