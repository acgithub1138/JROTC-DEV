import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Subtask, CreateSubtaskData } from '@/hooks/tasks/types';
import { createSubtaskSchema, SubtaskFormData } from './schemas/subtaskFormSchema';
import { useSubtasks } from '@/hooks/useSubtasks';
import { useTaskStatusOptions, useTaskPriorityOptions } from '@/hooks/useTaskOptions';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { SubtaskTitleField } from './fields/SubtaskTitleField';
import { SubtaskDescriptionField } from './fields/SubtaskDescriptionField';
import { TaskStatusField } from './fields/TaskStatusField';
import { TaskPriorityField } from './fields/TaskPriorityField';
import { TaskAssigneeField } from './fields/TaskAssigneeField';
import { TaskDueDateField } from './fields/TaskDueDateField';

interface SubtaskFormContentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  subtask?: Subtask;
  parentTaskId?: string;
}

export const SubtaskFormContent: React.FC<SubtaskFormContentProps> = ({
  open,
  onOpenChange,
  mode,
  subtask,
  parentTaskId,
}) => {
  const { createSubtask, updateSubtask, isCreating, isUpdating } = useSubtasks();
  const { statusOptions, isLoading: statusLoading } = useTaskStatusOptions();
  const { priorityOptions, isLoading: priorityLoading } = useTaskPriorityOptions();
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [createdSubtask, setCreatedSubtask] = useState<any>(null);
  const [showAttachments, setShowAttachments] = useState(false);

  // Create schema with current options
  const schema = createSubtaskSchema(
    statusOptions.map(s => s.value),
    priorityOptions.map(p => p.value)
  );

  const form = useForm<SubtaskFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: subtask?.title || '',
      description: subtask?.description || '',
      status: subtask?.status || 'not_started',
      priority: subtask?.priority || 'medium',
      assigned_to: subtask?.assigned_to || '',
      due_date: subtask?.due_date ? new Date(subtask.due_date) : undefined,
    },
  });

  // Update form values when options are loaded
  useEffect(() => {
    if (statusOptions.length > 0 && priorityOptions.length > 0) {
      const currentStatus = form.getValues('status');
      const currentPriority = form.getValues('priority');
      
      // Update with valid status if current is invalid
      if (!statusOptions.some(s => s.value === currentStatus)) {
        form.setValue('status', statusOptions[0]?.value || 'not_started');
      }
      
      // Update with valid priority if current is invalid
      if (!priorityOptions.some(p => p.value === currentPriority)) {
        form.setValue('priority', priorityOptions[0]?.value || 'medium');
      }
    }
  }, [statusOptions, priorityOptions, form]);

  const onSubmit = async (data: SubtaskFormData) => {
    try {
      if (mode === 'create') {
        if (!parentTaskId) {
          toast({
            title: "Error",
            description: "Parent task ID is required for subtask creation.",
            variant: "destructive",
          });
          return;
        }

        const subtaskData: CreateSubtaskData = {
          parent_task_id: parentTaskId,
          title: data.title,
          description: data.description || null,
          status: data.status,
          priority: data.priority,
          assigned_to: data.assigned_to === 'unassigned' ? null : data.assigned_to || null,
          due_date: data.due_date?.toISOString() || null,
        };

        const createdRecord = await createSubtask(subtaskData);
        setCreatedSubtask(createdRecord);
        
        // For page-based creation, navigate back to parent task or task list
        toast({
          title: 'Success',
          description: 'Subtask created successfully',
        });
        
        if (parentTaskId) {
          navigate(`/app/tasks/task_record?id=${parentTaskId}`);
        } else {
          navigate('/app/tasks');
        }
      } else {
        // Edit mode
        if (!subtask) return;

        await updateSubtask({
          id: subtask.id,
          title: data.title,
          description: data.description || null,
          status: data.status,
          priority: data.priority,
          assigned_to: data.assigned_to === 'unassigned' ? null : data.assigned_to || null,
          due_date: data.due_date?.toISOString() || null,
        });

        toast({
          title: "Subtask updated",
          description: "The subtask has been updated successfully.",
        });

        onOpenChange(false);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: "Error",
        description: "Failed to save subtask. Please try again.",
        variant: "destructive",
      });
    }
  };

  const onError = (errors: any) => {
    console.error('Form validation errors:', errors);
  };

  const handleAttachmentsComplete = () => {
    setCreatedSubtask(null);
    setShowAttachments(false);
    navigate(`/app/tasks/task_record?id=${createdSubtask?.id}`);
  };

  const handleSkipAttachments = () => {
    setCreatedSubtask(null);
    setShowAttachments(false);
    navigate('/app/tasks');
  };

  if (showAttachments && createdSubtask) {
    return (
      <div className="bg-background p-6 rounded-lg border space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Add Attachments</h2>
          <p className="text-muted-foreground mb-4">
            Your subtask "{createdSubtask.title}" has been created successfully. 
            Would you like to add any attachments?
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleAttachmentsComplete}>
            Add Attachments
          </Button>
          <Button variant="outline" onClick={handleSkipAttachments}>
            Skip Attachments
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background p-6 rounded-lg border">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-6">
          {/* Top Section - Two Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 border rounded-lg bg-card">
            {/* Left Column - Subtask Info */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Number</label>
                <div className="text-sm mt-1">
                  {mode === 'edit' && subtask ? subtask.id.slice(0, 8) : 'Auto-generated'}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created By</label>
                <div className="text-sm mt-1">
                  {mode === 'edit' && subtask?.assigned_by_profile 
                    ? `${subtask.assigned_by_profile.last_name}, ${subtask.assigned_by_profile.first_name}`
                    : userProfile ? `${userProfile.last_name}, ${userProfile.first_name}` : 'Unknown'
                  }
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created</label>
                <div className="text-sm mt-1">
                  {mode === 'edit' && subtask?.created_at 
                    ? new Date(subtask.created_at).toLocaleDateString()
                    : 'Today'
                  }
                </div>
              </div>
            </div>
            
            {/* Right Column - Priority, Status, Assigned to, Due Date */}
            <div className="space-y-4">
              <TaskPriorityField 
                form={form as any} 
                priorityOptions={priorityOptions}
                isLoading={priorityLoading}
              />
              <TaskStatusField 
                form={form as any} 
                statusOptions={statusOptions}
                isLoading={statusLoading}
              />
              <TaskAssigneeField 
                form={form as any} 
                canAssignTasks={true}
                canEditThisTask={true}
              />
              <TaskDueDateField form={form as any} />
            </div>
          </div>

          {/* Bottom Section - Single Column */}
          <div className="space-y-6 p-6 border rounded-lg bg-card">
            <SubtaskTitleField form={form} />
            <SubtaskDescriptionField form={form} />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isCreating || isUpdating}
            >
              {isCreating || isUpdating ? 'Saving...' : mode === 'create' ? 'Create Subtask' : 'Update Subtask'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};