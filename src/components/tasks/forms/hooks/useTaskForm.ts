
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTasks, Task } from '@/hooks/useTasks';
import { createTaskSchema, TaskFormData } from '../schemas/taskFormSchema';
import { useTaskStatusOptions, useTaskPriorityOptions } from '@/hooks/useTaskOptions';
import { useEmailTemplates } from '@/hooks/email/useEmailTemplates';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { resolveUserEmail } from '@/hooks/useEmailResolution';

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
  const { templates } = useEmailTemplates();
  const { toast } = useToast();
  
  // Notification state
  const [sendNotification, setSendNotification] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  
  // Filter templates for tasks
  const taskTemplates = templates.filter(template => 
    template.is_active && template.source_table === 'tasks'
  );

  // Get valid option values
  const validStatuses = statusOptions.map(option => option.value);
  const validPriorities = priorityOptions.map(option => option.value);

  // Create dynamic schema
  const schema = createTaskSchema(validStatuses, validPriorities, canAssignTasks);

  const form = useForm<TaskFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      assigned_to: task?.assigned_to || (canAssignTasks ? '' : currentUserId),
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
      
      // Auto-assign to current user if can't assign tasks and no assignment exists
      if (!canAssignTasks && !currentValues.assigned_to && currentUserId) {
        form.setValue('assigned_to', currentUserId);
      }
    }
  }, [validStatuses, validPriorities, canAssignTasks, currentUserId, form]);

  const sendNotificationEmail = async (assignedUserId: string, taskTitle: string) => {
    if (!sendNotification || !selectedTemplate || !assignedUserId) {
      return;
    }

    try {
      const assignedUserEmail = await resolveUserEmail(assignedUserId, '');
      if (!assignedUserEmail) {
        throw new Error('Could not resolve assignee email address');
      }

      const { error } = await supabase.functions.invoke('send-task-notification', {
        body: {
          to: assignedUserEmail,
          template_id: selectedTemplate,
          task_data: {
            title: taskTitle,
            assignee_name: assignedUserEmail,
          }
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Notification Sent",
        description: "Task notification email has been sent successfully.",
      });
    } catch (error) {
      console.error('Error sending notification:', error);
      toast({
        title: "Error",
        description: "Failed to send notification email.",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (data: TaskFormData) => {
    console.log('Form submitted with data:', data);

    // Validate notification requirements
    if (sendNotification && !selectedTemplate) {
      toast({
        title: "Template Required",
        description: "Please select an email template to send notification.",
        variant: "destructive",
      });
      return;
    }

    // Ensure assigned_to is set for users without assign permission
    const finalAssignedTo = data.assigned_to || (canAssignTasks ? '' : currentUserId);
    
    if (!finalAssignedTo) {
      console.error('No assigned user found');
      return;
    }

    const taskData = {
      title: data.title,
      description: data.description || null,
      status: data.status,
      priority: data.priority,
      assigned_to: finalAssignedTo,
      due_date: data.due_date ? data.due_date.toISOString() : null,
      team_id: null,
    };

    console.log('Prepared task data for submission:', taskData);

    try {
      if (mode === 'create') {
        console.log('Calling createTask...');
        await createTask(taskData);
      } else if (task) {
        console.log('Calling updateTask...');
        await updateTask({ id: task.id, ...taskData });
      }
      
      // Send notification email if requested
      if (sendNotification) {
        await sendNotificationEmail(finalAssignedTo, data.title);
      }
      
      // Only close and reset if successful
      onOpenChange(false);
      form.reset();
      setSendNotification(false);
      setSelectedTemplate('');
    } catch (error) {
      console.error('Task submission failed:', error);
      // Keep form open so user can try again
    }
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
    taskTemplates,
    sendNotification,
    setSendNotification,
    selectedTemplate,
    setSelectedTemplate,
  };
};
