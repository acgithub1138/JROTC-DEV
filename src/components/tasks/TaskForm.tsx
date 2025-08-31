import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Task } from '@/hooks/useTasks';
import { TaskFormContent } from './forms/TaskFormContent';
import { AttachmentSection } from '@/components/attachments/AttachmentSection';
interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  task?: Task;
}
export const TaskForm: React.FC<TaskFormProps> = ({
  open,
  onOpenChange,
  mode,
  task
}) => {
  const [createdTask, setCreatedTask] = useState<Task | null>(null);
  const [showAttachments, setShowAttachments] = useState(false);
  const [showAttachmentConfirm, setShowAttachmentConfirm] = useState(false);

  const handleClose = () => {
    if (showAttachments) {
      setShowAttachments(false);
      setCreatedTask(null);
      onOpenChange(false);
    } else {
      onOpenChange(false);
    }
  };

  const handleAttachmentConfirm = (addAttachments: boolean) => {
    setShowAttachmentConfirm(false);
    if (addAttachments) {
      setShowAttachments(true);
    } else {
      setCreatedTask(null);
      onOpenChange(false);
    }
  };

  const handleTaskCreated = (newTask: Task) => {
    setCreatedTask(newTask);
    setShowAttachmentConfirm(true);
  };
  const getDialogTitle = () => {
    if (showAttachments && createdTask) {
      return `Add Attachments - ${createdTask.task_number || createdTask.title}`;
    }
    if (mode === 'create') {
      return 'Create New Task';
    }
    if (task?.task_number) {
      return `${task.task_number} - ${task.title}`;
    }
    return `Edit Task - ${task.title}`;
  };
  return (
    <>
      <Dialog open={open && !showAttachmentConfirm} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {getDialogTitle()}
            </DialogTitle>
            <DialogDescription>
              {showAttachments 
                ? 'Your task has been created successfully! You can now add attachments or close this dialog.'
                : mode === 'create' 
                  ? 'Fill in the details to create a new task.' 
                  : 'Update the task details below.'
              }
            </DialogDescription>
          </DialogHeader>

          {showAttachments && createdTask ? (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="font-medium text-sm mb-2">Task Created Successfully!</h3>
                <p className="text-sm text-muted-foreground">
                  <strong>{createdTask.task_number}</strong> - {createdTask.title}
                </p>
              </div>
              
              <AttachmentSection
                recordType="task"
                recordId={createdTask.id}
                canEdit={true}
                defaultOpen={true}
              />

              <div className="flex justify-end pt-4">
                <Button onClick={() => handleClose()}>
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <TaskFormContent
              mode={mode}
              task={task}
              onTaskCreated={handleTaskCreated}
              onCancel={() => onOpenChange(false)}
              showAttachments={true}
            />
          )}
        </DialogContent>
      </Dialog>

        {/* Attachment Confirmation Dialog */}
        <Dialog open={showAttachmentConfirm} onOpenChange={() => {}}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Add Attachments?</DialogTitle>
              <DialogDescription>
                Your task has been created successfully! Would you like to add any file attachments?
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => handleAttachmentConfirm(false)}>
                No, I'm done
              </Button>
              <Button onClick={() => handleAttachmentConfirm(true)}>
                Yes, add attachments
              </Button>
            </div>
          </DialogContent>
        </Dialog>

    </>
  );
};