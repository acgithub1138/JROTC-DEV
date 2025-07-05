
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Task } from '@/hooks/useTasks';
import { useTaskForm } from './forms/hooks/useTaskForm';
import { TaskTitleField } from './forms/fields/TaskTitleField';
import { TaskAssigneeField } from './forms/fields/TaskAssigneeField';
import { TaskDescriptionField } from './forms/fields/TaskDescriptionField';
import { TaskPriorityStatusFields } from './forms/fields/TaskPriorityStatusFields';
import { TaskDueDateField } from './forms/fields/TaskDueDateField';

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  task?: Task;
}

export const TaskForm: React.FC<TaskFormProps> = ({ open, onOpenChange, mode, task }) => {
  const { userProfile } = useAuth();
  const { 
    form, 
    selectedDate, 
    setSelectedDate, 
    onSubmit, 
    isSubmitting, 
    isLoading, 
    statusOptions, 
    priorityOptions 
  } = useTaskForm({
    mode,
    task,
    onOpenChange,
  });

  const canAssignTasks = userProfile?.role === 'instructor' || userProfile?.role === 'command_staff';
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

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <TaskTitleField form={form} />
          
          <TaskAssigneeField form={form} canAssignTasks={canAssignTasks} />
          
          <TaskDescriptionField form={form} />
          
          <TaskPriorityStatusFields 
            form={form} 
            canAssignTasks={canAssignTasks} 
            isEditingAssignedTask={isEditingAssignedTask}
            statusOptions={statusOptions}
            priorityOptions={priorityOptions}
          />
          
          <TaskDueDateField 
            selectedDate={selectedDate} 
            setSelectedDate={setSelectedDate} 
          />

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {mode === 'create' ? 'Create Task' : 'Update Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
