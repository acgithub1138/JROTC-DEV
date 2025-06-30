
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTasks, Task } from '@/hooks/useTasks';
import { taskSchema, TaskFormData } from '../schemas/taskFormSchema';
import { TaskStatus, TaskPriority, getTaskStatusValues, getTaskPriorityValues } from '@/config/taskOptions';

interface UseTaskFormProps {
  mode: 'create' | 'edit';
  task?: Task;
  onOpenChange: (open: boolean) => void;
}

export const useTaskForm = ({ mode, task, onOpenChange }: UseTaskFormProps) => {
  const { createTask, updateTask, isCreating, isUpdating } = useTasks();
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    task?.due_date ? new Date(task.due_date) : undefined
  );

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      assigned_to: task?.assigned_to || '',
      priority: task?.priority || 'medium',
      status: task?.status || 'not_started',
    },
  });

  const onSubmit = (data: TaskFormData) => {
    console.log('Form submitted with data:', data);

    // Validate that the enum values are valid
    const validStatusValues = getTaskStatusValues();
    const validPriorityValues = getTaskPriorityValues();

    if (!validStatusValues.includes(data.status as TaskStatus)) {
      console.error('Invalid status value:', data.status);
      return;
    }

    if (!validPriorityValues.includes(data.priority as TaskPriority)) {
      console.error('Invalid priority value:', data.priority);
      return;
    }

    const taskData = {
      title: data.title,
      description: data.description || null,
      status: data.status as TaskStatus,
      priority: data.priority as TaskPriority,
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
  };

  return {
    form,
    selectedDate,
    setSelectedDate,
    onSubmit,
    isSubmitting: isCreating || isUpdating,
  };
};
