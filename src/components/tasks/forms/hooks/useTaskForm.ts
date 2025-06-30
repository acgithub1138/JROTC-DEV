
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTasks, Task } from '@/hooks/useTasks';
import { createTaskSchema, TaskFormData } from '../schemas/taskFormSchema';
import { useTaskStatusOptions, useTaskPriorityOptions } from '@/hooks/useTaskOptions';
import { validateTaskStatusSync, validateTaskPrioritySync } from '@/hooks/tasks/utils/taskValidation';

interface UseTaskFormProps {
  mode: 'create' | 'edit';
  task?: Task;
  onOpenChange: (open: boolean) => void;
}

export const useTaskForm = ({ mode, task, onOpenChange }: UseTaskFormProps) => {
  const { createTask, updateTask, isCreating, isUpdating } = useTasks();
  const { statusOptions, isLoading: statusLoading } = useTaskStatusOptions();
  const { priorityOptions, isLoading: priorityLoading } = useTaskPriorityOptions();
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    task?.due_date ? new Date(task.due_date) : undefined
  );

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

    // Validate that the enum values are valid using cached values
    try {
      const validatedStatus = validateTaskStatusSync(data.status, validStatuses);
      const validatedPriority = validateTaskPrioritySync(data.priority, validPriorities);

      const taskData = {
        title: data.title,
        description: data.description || null,
        status: validatedStatus,
        priority: validatedPriority,
        assigned_to: data.assigned_to || null,
        due_date: selectedDate ? selectedDate.toISOString() : null,
        team_id: null,
      };

      console.log('Prepared task data for submission:', taskData);

      if (mode === 'create') {
        createTask(taskData);
      } else if (task) {
        updateTask({ id: task.id, ...taskData });
      }
      
      onOpenChange(false);
      form.reset();
      setSelectedDate(undefined);
    } catch (error) {
      console.error('Validation error:', error);
    }
  };

  return {
    form,
    selectedDate,
    setSelectedDate,
    onSubmit,
    isSubmitting: isCreating || isUpdating,
    isLoading: statusLoading || priorityLoading,
    statusOptions,
    priorityOptions,
  };
};
