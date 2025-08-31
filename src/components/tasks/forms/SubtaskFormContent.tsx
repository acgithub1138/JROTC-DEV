import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Subtask, CreateSubtaskData } from '@/hooks/tasks/types';
import { createSubtaskSchema, SubtaskFormData } from './schemas/subtaskFormSchema';
import { useSubtasks } from '@/hooks/useSubtasks';
import { useTaskStatusOptions, useTaskPriorityOptions } from '@/hooks/useTaskOptions';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { SubtaskTitleField } from './fields/SubtaskTitleField';
import { SubtaskDescriptionField } from './fields/SubtaskDescriptionField';
import { SharedTaskFormLayout } from './SharedTaskFormLayout';
import { AttachmentSection } from '@/components/attachments/AttachmentSection';
import { useAttachments } from '@/hooks/attachments/useAttachments';
import { useSubtaskSystemComments } from '@/hooks/useSubtaskSystemComments';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';
import { formatSubtaskFieldChangeComment } from '@/utils/subtaskCommentUtils';

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
  const navigate = useNavigate();
  const { handleSystemComment } = useSubtaskSystemComments();
  const { users } = useSchoolUsers();

  const [createdSubtask, setCreatedSubtask] = useState<any>(null);
  const [showAttachments, setShowAttachments] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const { uploadFile, isUploading } = useAttachments('subtask', subtask?.id || 'temp');

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

  const uploadPendingFiles = async (subtaskId: string) => {
    if (pendingFiles.length === 0) return;
    
    setIsUploadingFiles(true);
    try {
      // Upload files one by one and wait for completion
      for (const file of pendingFiles) {
        await uploadFile({
          record_type: 'subtask',
          record_id: subtaskId,
          file
        });
      }
      setPendingFiles([]);
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setIsUploadingFiles(false);
    }
  };

  const onSubmit = async (data: SubtaskFormData) => {
    try {
      if (mode === 'create') {
        if (!parentTaskId) {
          toast.error("Parent task ID is required for subtask creation.");
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
        
        // Upload pending files if any
        if (pendingFiles.length > 0) {
          await uploadPendingFiles(createdRecord.id);
        }
        
        setCreatedSubtask(createdRecord);
        
        // For page-based creation, navigate back to task list
        toast.success('Subtask created successfully');
        
        navigate('/app/tasks');
      } else {
        // Edit mode
        if (!subtask) return;

        const subtaskUpdateData = {
          id: subtask.id,
          title: data.title,
          description: data.description || null,
          status: data.status,
          priority: data.priority,
          assigned_to: data.assigned_to === 'unassigned' ? null : data.assigned_to || null,
          due_date: data.due_date?.toISOString() || null,
        };

        await updateSubtask(subtaskUpdateData);

        // Add system comments for tracked field changes
        const trackedFields = ['status', 'priority', 'assigned_to', 'due_date', 'title'];
        const changeComments: string[] = [];
        
        for (const field of trackedFields) {
          let oldValue, newValue;
          
          switch (field) {
            case 'status':
              oldValue = subtask.status;
              newValue = subtaskUpdateData.status;
              break;
            case 'priority':
              oldValue = subtask.priority;
              newValue = subtaskUpdateData.priority;
              break;
            case 'assigned_to':
              oldValue = subtask.assigned_to;
              newValue = subtaskUpdateData.assigned_to;
              break;
            case 'due_date':
              oldValue = subtask.due_date;
              newValue = subtaskUpdateData.due_date;
              break;
            case 'title':
              oldValue = subtask.title;
              newValue = subtaskUpdateData.title;
              break;
            default:
              continue;
          }
          
          if (oldValue !== newValue) {
            const commentText = formatSubtaskFieldChangeComment(
              field,
              oldValue,
              newValue,
              statusOptions,
              priorityOptions,
              users
            );
            changeComments.push(commentText);
          }
        }
        
        // Add a single system comment with all changes
        if (changeComments.length > 0) {
          const commentText = changeComments.length === 1 
            ? changeComments[0] 
            : changeComments.join('\n• ');
          await handleSystemComment(subtask.id, changeComments.length === 1 ? commentText : '• ' + commentText);
        }

        toast.success("The subtask has been updated successfully.");

        onOpenChange(false);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error("Failed to save subtask. Please try again.");
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
    <SharedTaskFormLayout
      form={form}
      onSubmit={form.handleSubmit(onSubmit, onError)}
      mode={mode}
      taskNumber={mode === 'edit' && subtask ? subtask.id.slice(0, 8) : undefined}
      createdAt={subtask?.created_at}
      createdBy={mode === 'edit' && subtask?.assigned_by_profile 
        ? `${subtask.assigned_by_profile.last_name}, ${subtask.assigned_by_profile.first_name}`
        : undefined
      }
      canAssignTasks={true}
      canEditThisTask={true}
      isEditingAssignedTask={false}
      statusOptions={statusOptions}
      priorityOptions={priorityOptions}
      titleField={<SubtaskTitleField form={form} />}
      descriptionField={<SubtaskDescriptionField form={form} />}
      attachmentSection={mode === 'create' ? (
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <label className="w-32 text-right text-sm font-medium">Attachments</label>
            <div className="flex-1">
              <input
                type="file"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  setPendingFiles(prev => [...prev, ...files]);
                }}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
              />
              {pendingFiles.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-muted-foreground">Files to upload after subtask creation:</p>
                  {pendingFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-muted p-2 rounded text-sm">
                      <span>{file.name}</span>
                      <button
                        type="button"
                        onClick={() => setPendingFiles(prev => prev.filter((_, i) => i !== index))}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {isUploadingFiles && (
                    <div className="text-sm text-blue-600 font-medium">
                      Uploading files...
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        subtask && (
          <AttachmentSection
            recordType="subtask"
            recordId={subtask.id}
            canEdit={true}
            defaultOpen={false}
          />
        )
      )}
      onCancel={() => onOpenChange(false)}
      submitButtonText={mode === 'create' ? 'Create Subtask' : 'Update Subtask'}
      isSubmitting={isCreating || isUpdating}
      isSubmitDisabled={isUploading || isUploadingFiles}
    />
  );
};