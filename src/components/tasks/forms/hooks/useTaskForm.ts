
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTasks, Task } from '@/hooks/useTasks';
import { createTaskSchema, TaskFormData } from '../schemas/taskFormSchema';
import { useTaskStatusOptions, useTaskPriorityOptions } from '@/hooks/useTaskOptions';

interface UseTaskFormProps {
  mode: 'create' | 'edit';
  task?: Task;
  onOpenChange: (open: boolean) => void;
  canAssignTasks: boolean;
  currentUserId: string;
}

export const useTaskForm = ({ mode, task, onOpenChange, canAssignTasks, currentUserId }: UseTaskFormProps) => {
  const { createTask, updateTask, isCreating, isUpdating } = useTasks();
  const { statusOptions, isLoading: statusLoading } = useTaskStatusOptions();
  const { priorityOptions, isLoading: priorityLoading } = useTaskPriorityOptions();

  // Get valid option values
  const validStatuses = statusOptions.map(option => option.value);
  const validPriorities = priorityOptions.map(option => option.value);

  // Create dynamic schema
  const schema = createTaskSchema(validStatuses, validPriorities);

  const form = useForm<TaskFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      assigned_to: task?.assigned_to || '',
      priority: task?.priority || (validPriorities[0] || 'medium'),
      status: task?.status || (validStatuses[0] || 'not_started'),
      due_date: task?.due_date ? new Date(task.due_date) : undefined,
    },
  });

  // Update form when options load
  useEffect(() => {
    if (validStatuses.length > 0 && validPriorities.length > 0) {
      const currentValues = form.getValues();
      
      // Set default values if current values are invalid
      if (!validStatuses.includes(currentValues.status)) {
        form.setValue('status', validStatuses[0]);
      }
      if (!validPriorities.includes(currentValues.priority)) {
        form.setValue('priority', validPriorities[0]);
      }
    }
  }, [validStatuses, validPriorities, form]);

  const onSubmit = (data: TaskFormData) => {
    console.log('Form submitted with data:', data);

    const taskData = {
      title: data.title,
      description: data.description || null,
      status: data.status,
      priority: data.priority,
      assigned_to: data.assigned_to,
      due_date: data.due_date ? data.due_date.toISOString() : null,
      team_id: null,
    };

    console.log('Prepared task data for submission:', taskData);

    if (mode === 'create') {
      console.log('Calling createTask...');
      createTask(taskData);
    } else if (task) {
      console.log('Calling updateTask...');
      updateTask({ id: task.id, ...taskData });
    }
    
    onOpenChange(false);
    form.reset();
  };

  const onError = (errors: any) => {
    console.log('Form validation errors:', errors);
  };

  return {
    form,
    onSubmit,
    onError,
    isSubmitting: isCreating || isUpdating,
    isLoading: statusLoading || priorityLoading,
    statusOptions,
    priorityOptions,
  };
};
