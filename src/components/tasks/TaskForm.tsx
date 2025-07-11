
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { useAuth } from '@/contexts/AuthContext';
import { Task } from '@/hooks/useTasks';
import { useTaskForm } from './forms/hooks/useTaskForm';
import { TaskTitleField } from './forms/fields/TaskTitleField';
import { TaskAssigneeField } from './forms/fields/TaskAssigneeField';
import { TaskDescriptionField } from './forms/fields/TaskDescriptionField';
import { TaskPriorityStatusFields } from './forms/fields/TaskPriorityStatusFields';
import { TaskDueDateField } from './forms/fields/TaskDueDateField';
import { useTaskPermissions } from '@/hooks/useModuleSpecificPermissions';

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  task?: Task;
}

export const TaskForm: React.FC<TaskFormProps> = ({ open, onOpenChange, mode, task }) => {
  const { userProfile } = useAuth();
  const { canAssign, canUpdate, canUpdateAssigned } = useTaskPermissions();
  
  const canAssignTasks = canAssign;
  const canEditThisTask = canUpdate || (canUpdateAssigned && task?.assigned_to === userProfile?.id);
  
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
    currentUserId: userProfile?.id || '',
  });
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
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <div className="flex items-center justify-center p-6">
            <div className="text-center">Loading task options...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {getDialogTitle()}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Fill in the details to create a new task.'
              : 'Update the task details below.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-4">
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

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {mode === 'create' ? 'Create Task' : 'Update Task'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
