import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { useSubtasks } from '@/hooks/useSubtasks';
import { useTaskStatusOptions, useTaskPriorityOptions } from '@/hooks/useTaskOptions';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';
import { AttachmentSection } from '@/components/attachments/AttachmentSection';
interface CreateSubtaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  parentTaskId: string;
  parentTaskTitle: string;
}
export const CreateSubtaskDialog: React.FC<CreateSubtaskDialogProps> = ({
  isOpen,
  onClose,
  parentTaskId,
  parentTaskTitle
}) => {
  const {
    createSubtask
  } = useSubtasks();
  const {
    statusOptions
  } = useTaskStatusOptions();
  const {
    priorityOptions
  } = useTaskPriorityOptions();
  const {
    users
  } = useSchoolUsers(true); // Only fetch active users

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'not_started',
    priority: 'medium',
    assigned_to: '',
    due_date: null as Date | null
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [createdSubtask, setCreatedSubtask] = useState<any>(null);
  const [showAttachmentConfirm, setShowAttachmentConfirm] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);

  // Track form changes for unsaved warning
  useEffect(() => {
    const hasChanges = !!(
      formData.title ||
      formData.description ||
      formData.assigned_to ||
      formData.due_date ||
      formData.status !== 'not_started' ||
      formData.priority !== 'medium'
    );
    setHasUnsavedChanges(hasChanges);
  }, [formData]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const subtask = await createSubtask({
        parent_task_id: parentTaskId,
        title: formData.title,
        description: formData.description || null,
        status: formData.status,
        priority: formData.priority,
        assigned_to: formData.assigned_to === 'unassigned' ? null : formData.assigned_to || null,
        due_date: formData.due_date?.toISOString() || null
      });
      
      setCreatedSubtask(subtask);
      setShowAttachmentConfirm(true);
      resetForm();
    } catch (error) {
      console.error('Failed to create subtask:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      status: 'not_started',
      priority: 'medium',
      assigned_to: '',
      due_date: null
    });
    setHasUnsavedChanges(false);
  };

  const handleAttachmentConfirm = (hasAttachments: boolean) => {
    setShowAttachmentConfirm(false);
    if (hasAttachments) {
      setShowAttachments(true);
    } else {
      setCreatedSubtask(null);
      setShowAttachments(false);
      onClose();
    }
  };

  const handleAttachmentsComplete = () => {
    setCreatedSubtask(null);
    setShowAttachments(false);
    onClose();
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowConfirmDialog(true);
    } else {
      onClose();
    }
  };

  const confirmClose = () => {
    setShowConfirmDialog(false);
    resetForm();
    onClose();
  };

  const cancelClose = () => {
    setShowConfirmDialog(false);
  };
  return (
    <>
      <Dialog open={isOpen} onOpenChange={hasUnsavedChanges ? handleClose : onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {showAttachments ? `Add Attachments to: ${createdSubtask?.title}` : `Create Subtask for: ${parentTaskTitle}`}
          </DialogTitle>
        </DialogHeader>
        
        {showAttachments && createdSubtask ? (
          <div className="space-y-4">
            <AttachmentSection
              recordType="subtask"
              recordId={createdSubtask.id}
              canEdit={true}
              defaultOpen={true}
            />
            <div className="flex justify-end">
              <Button onClick={handleAttachmentsComplete}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input id="title" value={formData.title} onChange={e => setFormData({
              ...formData,
              title: e.target.value
            })} placeholder="Enter subtask title" required />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={formData.description} onChange={e => setFormData({
              ...formData,
              description: e.target.value
            })} placeholder="Enter subtask description" rows={3} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={value => setFormData({
                ...formData,
                status: value
              })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(option => <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Priority</Label>
                <Select value={formData.priority} onValueChange={value => setFormData({
                ...formData,
                priority: value
              })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map(option => <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Assigned To</Label>
                <Select value={formData.assigned_to} onValueChange={value => setFormData({
                ...formData,
                assigned_to: value
              })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {users
                      .filter(user => user.active === true && (user.role === 'cadet' || user.role === 'command_staff'))
                      .sort((a, b) => a.last_name.localeCompare(b.last_name))
                      .map(user => <SelectItem key={user.id} value={user.id}>
                          {user.last_name}, {user.first_name}
                        </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Due Date</Label>
                <Input type="date" value={formData.due_date ? format(formData.due_date, 'yyyy-MM-dd') : ''} onChange={e => {
                const dateValue = e.target.value;
                if (dateValue) {
                  // Create date object from input value with validation
                  const date = new Date(dateValue + 'T12:00:00');
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  tomorrow.setHours(0, 0, 0, 0);
                  if (date >= tomorrow) {
                    setFormData({
                      ...formData,
                      due_date: date
                    });
                  }
                } else {
                  setFormData({
                    ...formData,
                    due_date: null
                  });
                }
              }} min={(() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                return format(tomorrow, 'yyyy-MM-dd');
              })()} className="w-full" />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={hasUnsavedChanges ? handleClose : onClose}>
                Cancel
              </Button>
              <Button type="submit">Create Subtask</Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>

    {/* Unsaved Changes Confirmation Dialog */}
    <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved changes. Are you sure you want to close without saving?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={cancelClose}>Stay</AlertDialogCancel>
          <AlertDialogAction onClick={confirmClose}>Discard Changes</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    {/* Attachment Confirmation Dialog */}
    <AlertDialog open={showAttachmentConfirm} onOpenChange={setShowAttachmentConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Add Attachments?</AlertDialogTitle>
          <AlertDialogDescription>
            Your subtask has been created successfully. Would you like to add any attachments to it?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => handleAttachmentConfirm(false)}>No, I'm done</AlertDialogCancel>
          <AlertDialogAction onClick={() => handleAttachmentConfirm(true)}>Yes, add attachments</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>
  );
};