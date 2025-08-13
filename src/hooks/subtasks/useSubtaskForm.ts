import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSubtasks, Subtask } from '@/hooks/useSubtasks';
import { createSubtaskSchema, SubtaskFormData } from '@/components/tasks/forms/schemas/subtaskFormSchema';
import { useTaskStatusOptions, useTaskPriorityOptions } from '@/hooks/useTaskOptions';

interface UseSubtaskFormProps {
  mode: 'edit';
  subtask?: Subtask;
  onOpenChange: (open: boolean) => void;
  canAssignTasks: boolean;
  currentUserId: string;
}

export const useSubtaskForm = ({ mode, subtask, onOpenChange, canAssignTasks, currentUserId }: UseSubtaskFormProps) => {
  const { updateSubtask, isUpdating } = useSubtasks(subtask?.parent_task_id);
  const { statusOptions, isLoading: statusLoading } = useTaskStatusOptions();
  const { priorityOptions, isLoading: priorityLoading } = useTaskPriorityOptions();

  // Get valid option values
  const validStatuses = statusOptions.map(option => option.value);
  const validPriorities = priorityOptions.map(option => option.value);

  // Create dynamic schema
  const schema = createSubtaskSchema(validStatuses, validPriorities);

  const form = useForm<SubtaskFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: subtask?.title || '',
      description: subtask?.description || '',
      assigned_to: subtask?.assigned_to || '',
      priority: subtask?.priority || (validPriorities[0] || 'medium'),
      status: subtask?.status || (validStatuses[0] || 'not_started'),
      due_date: subtask?.due_date ? new Date(subtask.due_date) : undefined,
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

  const onSubmit = async (data: SubtaskFormData) => {
    console.log('Subtask form submitted with data:', data);

    if (!subtask) {
      console.error('No subtask found for update');
      return;
    }

    const subtaskData = {
      id: subtask.id,
      title: data.title,
      description: data.description || null,
      status: data.status,
      priority: data.priority,
      assigned_to: data.assigned_to || null,
      due_date: data.due_date ? data.due_date.toISOString() : null,
    };

    console.log('Prepared subtask data for submission:', subtaskData);

    try {
      await updateSubtask(subtaskData as any);
      
      // Only close and reset if successful
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Subtask submission failed:', error);
      // Keep form open so user can try again
    }
  };

  const onError = (errors: any) => {
    console.log('Subtask form validation errors:', errors);
  };

  return {
    form,
    onSubmit,
    onError,
    isSubmitting: isUpdating,
    isLoading: statusLoading || priorityLoading,
    statusOptions,
    priorityOptions,
  };
};
