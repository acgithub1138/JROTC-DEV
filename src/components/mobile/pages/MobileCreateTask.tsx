import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ArrowLeft, Save } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTaskForm } from '@/components/tasks/forms/hooks/useTaskForm';
import { TaskTitleField } from '@/components/tasks/forms/fields/TaskTitleField';
import { TaskAssigneeField } from '@/components/tasks/forms/fields/TaskAssigneeField';
import { TaskDescriptionField } from '@/components/tasks/forms/fields/TaskDescriptionField';
import { TaskPriorityStatusFields } from '@/components/tasks/forms/fields/TaskPriorityStatusFields';
import { TaskDueDateField } from '@/components/tasks/forms/fields/TaskDueDateField';
import { useTaskPermissions } from '@/hooks/useModuleSpecificPermissions';
import { useToast } from '@/hooks/use-toast';

export const MobileCreateTask: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { canAssign, canCreate } = useTaskPermissions();
  const { toast } = useToast();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Redirect if user doesn't have create permission
  useEffect(() => {
    if (!canCreate) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to create tasks.",
        variant: "destructive"
      });
      navigate('/mobile/tasks');
    }
  }, [canCreate, navigate, toast]);

  const {
    form,
    onSubmit,
    onError,
    isSubmitting,
    isLoading,
    statusOptions,
    priorityOptions
  } = useTaskForm({
    mode: 'create',
    onOpenChange: (open) => {
      if (!open) {
        navigate('/mobile/tasks');
      }
    },
    canAssignTasks: canAssign,
    currentUserId: userProfile?.id || ''
  });

  // Track form changes for unsaved warning
  useEffect(() => {
    const subscription = form.watch((value) => {
      const hasChanges = !!(value.title || value.description || value.assigned_to || (value.due_date && value.due_date.getTime() > 0));
      setHasUnsavedChanges(hasChanges);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setShowConfirmDialog(true);
    } else {
      navigate('/mobile/tasks');
    }
  };

  const confirmDiscard = () => {
    setShowConfirmDialog(false);
    form.reset();
    navigate('/mobile/tasks');
  };

  const cancelDiscard = () => {
    setShowConfirmDialog(false);
  };

  if (!canCreate) {
    return null; // Will redirect in useEffect
  }

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
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="mr-2 p-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-semibold">Create New Task</h1>
            </div>
            <Button
              type="submit"
              form="task-form"
              disabled={isSubmitting}
              size="sm"
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-4 pb-20">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Task Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form 
                  id="task-form"
                  onSubmit={form.handleSubmit(onSubmit, onError)} 
                  className="space-y-4"
                >
                  <TaskTitleField form={form} />
                  
                  <TaskAssigneeField 
                    form={form} 
                    canAssignTasks={canAssign} 
                    canEditThisTask={true} 
                  />
                  
                  <TaskDescriptionField form={form} />
                  
                  <TaskPriorityStatusFields 
                    form={form} 
                    canAssignTasks={canAssign} 
                    canEditThisTask={true} 
                    isEditingAssignedTask={false}
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
              You have unsaved changes. Are you sure you want to go back without saving?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDiscard}>Stay</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDiscard}>Discard Changes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};