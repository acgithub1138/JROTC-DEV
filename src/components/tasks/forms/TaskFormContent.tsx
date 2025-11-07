import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Task } from '@/hooks/useTasks';
import { useTaskForm } from './hooks/useTaskForm';
import { TaskTitleField } from './fields/TaskTitleField';
import { TaskDescriptionField } from './fields/TaskDescriptionField';
import { useTaskPermissions } from '@/hooks/useModuleSpecificPermissions';
import { AttachmentSection } from '@/components/attachments/AttachmentSection';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { useAttachments } from '@/hooks/attachments/useAttachments';
import { SharedTaskFormLayout } from './SharedTaskFormLayout';

interface TaskFormContentProps {
  mode: 'create' | 'edit';
  task?: Task;
  onSuccess?: () => void;
  onCancel?: () => void;
  showAttachments?: boolean;
  onTaskCreated?: (task: Task) => void;
  hideActionButtons?: boolean;
  renderSubmitButton?: (props: { isSubmitting: boolean; isDisabled: boolean; text: string; onClick: () => void }) => React.ReactNode;
  renderCancelButton?: (props: { onClick: () => void }) => React.ReactNode;
}

export const TaskFormContent: React.FC<TaskFormContentProps> = ({
  mode,
  task,
  onSuccess,
  onCancel,
  showAttachments = true,
  onTaskCreated,
  hideActionButtons = false,
  renderSubmitButton,
  renderCancelButton,
}) => {
  const { userProfile } = useAuth();
  const { canAssign, canUpdate, canUpdateAssigned } = useTaskPermissions();
  const canAssignTasks = canAssign;
  const canEditThisTask = canUpdate || (canUpdateAssigned && task?.assigned_to === userProfile?.id);
  
  
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

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
    onOpenChange: () => {}, // Not used in page context
    canAssignTasks,
    currentUserId: userProfile?.id || '',
    onTaskCreated: async (newTask: Task) => {
      setHasUnsavedChanges(false);
      
      // Upload pending files if any
      if (pendingFiles.length > 0 && mode === 'create') {
        await uploadPendingFiles(newTask.id);
      }
      
      if (onTaskCreated) {
        onTaskCreated(newTask);
      } else if (onSuccess) {
        onSuccess();
      }
    }
  });
  
  // Initialize attachment hooks for file upload (with dummy ID for create mode)
  const { uploadFile, isUploading } = useAttachments('task', task?.id || 'temp');
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  
  const uploadPendingFiles = async (taskId: string) => {
    if (pendingFiles.length === 0) return;
    
    setIsUploadingFiles(true);
    try {
      // Upload files one by one and wait for completion
      for (const file of pendingFiles) {
        await uploadFile({
          record_type: 'task',
          record_id: taskId,
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

  // Track form changes for unsaved warning
  useEffect(() => {
    const subscription = form.watch((value) => {
      const hasChanges = mode === 'create' 
        ? !!(value.title || value.description || value.assigned_to || (value.due_date && value.due_date.getTime() > 0))
        : !!(
          value.title !== (task?.title || '') ||
          value.description !== (task?.description || '') ||
          value.assigned_to !== (task?.assigned_to || '') ||
          value.priority !== (task?.priority || 'medium') ||
          value.status !== (task?.status || 'not_started') ||
          (value.due_date?.getTime() || null) !== (task?.due_date ? new Date(task.due_date).getTime() : null)
        );
      setHasUnsavedChanges(hasChanges);
    });
    return () => subscription.unsubscribe();
  }, [form, mode, task]);

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowConfirmDialog(true);
    } else if (onCancel) {
      onCancel();
    }
  };

  const confirmCancel = () => {
    setShowConfirmDialog(false);
    form.reset();
    if (onCancel) {
      onCancel();
    }
  };

  const cancelConfirm = () => {
    setShowConfirmDialog(false);
  };

  const handleSubmit = async (data: any) => {
    await onSubmit(data);
    if (onSuccess && mode === 'edit') {
      onSuccess();
    }
  };

  const isEditingAssignedTask = mode === 'edit' && task?.assigned_to === userProfile?.id;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="text-center">Loading task options...</div>
      </div>
    );
  }

  // Create attachment section for the layout
  const attachmentSection = mode === 'create' ? (
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
              <p className="text-sm text-muted-foreground">Files to upload after task creation:</p>
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
    task?.id && showAttachments && (
      <AttachmentSection
        recordType="task"
        recordId={task.id}
        canEdit={canEditThisTask}
        defaultOpen={false}
      />
    )
  );

  return (
    <>
      <SharedTaskFormLayout
        form={form}
        onSubmit={form.handleSubmit(handleSubmit, onError)}
        mode={mode}
        taskNumber={task?.task_number}
        createdAt={task?.created_at}
        createdBy={task?.assigned_by_profile ? `${task.assigned_by_profile.last_name}, ${task.assigned_by_profile.first_name}` : undefined}
        canAssignTasks={canAssignTasks}
        canEditThisTask={canEditThisTask}
        isEditingAssignedTask={isEditingAssignedTask}
        statusOptions={statusOptions}
        priorityOptions={priorityOptions}
        titleField={<TaskTitleField form={form} />}
        descriptionField={<TaskDescriptionField form={form} />}
        attachmentSection={attachmentSection}
        onCancel={handleCancel}
        submitButtonText={mode === 'create' ? 'Create Task' : 'Update Task'}
        isSubmitting={isSubmitting}
        isSubmitDisabled={isUploadingFiles}
        hideActionButtons={hideActionButtons}
      />

      <UnsavedChangesDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onDiscard={confirmCancel}
        onCancel={cancelConfirm}
        title="Unsaved Changes"
        description="You have unsaved changes. Are you sure you want to discard them?"
      />
    </>
  );
};