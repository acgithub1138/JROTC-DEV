import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ArrowLeft, Save, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Subtask } from '@/hooks/useSubtasks';
import { useSubtaskForm } from '@/hooks/subtasks/useSubtaskForm';
import { SubtaskTitleField } from '@/components/tasks/forms/fields/SubtaskTitleField';
import { SubtaskAssigneeField } from '@/components/tasks/forms/fields/SubtaskAssigneeField';
import { SubtaskDescriptionField } from '@/components/tasks/forms/fields/SubtaskDescriptionField';
import { SubtaskPriorityStatusFields } from '@/components/tasks/forms/fields/SubtaskPriorityStatusFields';
import { SubtaskDueDateField } from '@/components/tasks/forms/fields/SubtaskDueDateField';
import { useTaskPermissions } from '@/hooks/useModuleSpecificPermissions';

interface MobileSubtaskFormProps {
  subtask: Subtask;
  onCancel: () => void;
  onSuccess: () => void;
}

export const MobileSubtaskForm: React.FC<MobileSubtaskFormProps> = ({
  subtask,
  onCancel,
  onSuccess
}) => {
  const { userProfile } = useAuth();
  const { canAssign, canUpdate, canUpdateAssigned } = useTaskPermissions();
  const canAssignTasks = canAssign;
  const canEditThisSubtask = canUpdate || (canUpdateAssigned && subtask?.assigned_to === userProfile?.id);
  
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
  } = useSubtaskForm({
    mode: 'edit',
    subtask,
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
        value.title !== (subtask?.title || '') ||
        value.description !== (subtask?.description || '') ||
        value.assigned_to !== (subtask?.assigned_to || 'unassigned') ||
        value.priority !== (subtask?.priority || 'medium') ||
        value.status !== (subtask?.status || 'not_started') ||
        (value.due_date?.getTime() || null) !== (subtask?.due_date ? new Date(subtask.due_date).getTime() : null)
      );
      setHasUnsavedChanges(hasChanges);
    });
    return () => subscription.unsubscribe();
  }, [form, subtask]);

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

  const isEditingAssignedSubtask = subtask?.assigned_to === userProfile?.id;

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
                  Edit Subtask
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
                form="subtask-edit-form"
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
              <CardTitle className="text-base">Edit Subtask Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form 
                  id="subtask-edit-form"
                  onSubmit={form.handleSubmit(onSubmit, onError)} 
                  className="space-y-4"
                >
                  <SubtaskTitleField form={form} />
                  
                  <SubtaskAssigneeField 
                    form={form} 
                    canAssignTasks={canAssignTasks} 
                    canEditThisTask={canEditThisSubtask} 
                  />
                  
                  <SubtaskDescriptionField form={form} />
                  
                  <SubtaskPriorityStatusFields 
                    form={form} 
                    canAssignTasks={canAssignTasks} 
                    canEditThisTask={canEditThisSubtask} 
                    isEditingAssignedTask={isEditingAssignedSubtask}
                    statusOptions={statusOptions} 
                    priorityOptions={priorityOptions} 
                  />
                  
                  <SubtaskDueDateField form={form} />
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