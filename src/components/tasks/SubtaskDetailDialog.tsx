import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Check, Save, X, Calendar as CalendarIcon, Flag, User, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { useSubtaskComments } from '@/hooks/useSubtaskComments';
import { useSubtasks, Subtask } from '@/hooks/useSubtasks';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';
import { useAuth } from '@/contexts/AuthContext';
import { useTaskStatusOptions, useTaskPriorityOptions } from '@/hooks/useTaskOptions';
import { useTablePermissions } from '@/hooks/useTablePermissions';
import { useEmailTemplates } from '@/hooks/email/useEmailTemplates';
import { useEmailRules } from '@/hooks/email/useEmailRules';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { resolveUserEmail } from '@/hooks/useEmailResolution';
import { getDefaultCompletionStatus, isTaskDone } from '@/utils/taskStatusUtils';
import { TaskCommentsSection } from './components/TaskCommentsSection';
import { UnsavedCommentModal } from './components/UnsavedCommentModal';

interface SubtaskDetailDialogProps {
  subtask: Subtask;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (subtask: Subtask) => void;
}

export const SubtaskDetailDialog: React.FC<SubtaskDetailDialogProps> = ({ 
  subtask, 
  open, 
  onOpenChange, 
  onEdit 
}) => {
  const { userProfile } = useAuth();
  const { updateSubtask, subtasks, isUpdating } = useSubtasks(subtask.parent_task_id);
  const { users } = useSchoolUsers(true); // Only fetch active users
  const { comments, addComment, addSystemComment, isAddingComment } = useSubtaskComments(subtask.id);
  const { statusOptions } = useTaskStatusOptions();
  const { priorityOptions } = useTaskPriorityOptions();
  const { canEdit: canUpdate, canDelete } = useTablePermissions('tasks');
  const { templates } = useEmailTemplates();
  const { rules } = useEmailRules();
  const { toast } = useToast();
  const canAssign = canUpdate; // For now, use update permission for assign
  const [currentSubtask, setCurrentSubtask] = useState(subtask);
  const [sendNotification, setSendNotification] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [showUnsavedCommentModal, setShowUnsavedCommentModal] = useState(false);
  const [pendingSaveAction, setPendingSaveAction] = useState<(() => Promise<void>) | null>(null);
  const [editData, setEditData] = useState({
    title: subtask.title,
    description: subtask.description || '',
    status: subtask.status,
    priority: subtask.priority,
    assigned_to: subtask.assigned_to || 'unassigned',
    due_date: subtask.due_date ? new Date(subtask.due_date) : null,
  });

  // Filter templates for subtasks (use task templates)
  const subtaskTemplates = templates.filter(template => 
    template.is_active && template.source_table === 'tasks'
  );

  // Track changes for unsaved warning
  useEffect(() => {
    const hasChanges = 
      editData.title !== currentSubtask.title ||
      editData.description !== (currentSubtask.description || '') ||
      editData.status !== currentSubtask.status ||
      editData.priority !== currentSubtask.priority ||
      editData.assigned_to !== (currentSubtask.assigned_to || 'unassigned') ||
      (editData.due_date?.getTime() !== (currentSubtask.due_date ? new Date(currentSubtask.due_date).getTime() : null));
    
    setHasUnsavedChanges(hasChanges || sendNotification);
  }, [editData, currentSubtask, sendNotification]);

  // Update currentSubtask and editData when the subtask prop changes or when subtasks are refetched
  useEffect(() => {
    const updatedSubtask = subtasks.find(s => s.id === subtask.id);
    const subtaskToUse = updatedSubtask || subtask;
    setCurrentSubtask(subtaskToUse);
    setEditData({
      title: subtaskToUse.title,
      description: subtaskToUse.description || '',
      status: subtaskToUse.status,
      priority: subtaskToUse.priority,
      assigned_to: subtaskToUse.assigned_to || 'unassigned',
      due_date: subtaskToUse.due_date ? new Date(subtaskToUse.due_date) : null,
    });
  }, [subtask, subtasks]);

  const canEdit = canUpdate || currentSubtask.assigned_to === userProfile?.id;

  const sendNotificationEmail = async () => {
    const newAssignedTo = editData.assigned_to === 'unassigned' ? null : editData.assigned_to;
    if (!sendNotification || !selectedTemplate || !newAssignedTo) {
      return;
    }

    try {
      // Find the assigned user for name information
      let assignedUser: { id: string; first_name: string; last_name: string } | undefined = users.find(u => u.id === newAssignedTo);
      
      // If user not found in school users, fetch directly
      if (!assignedUser) {
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .eq('id', newAssignedTo)
          .single();
          
        if (userError || !userData) {
          console.error('Error fetching user data:', userError);
          toast({
            title: "Error",
            description: "Could not find the assigned user's information.",
            variant: "destructive",
          });
          return;
        }
        
        assignedUser = userData as { id: string; first_name: string; last_name: string };
      }
      
      // Resolve email with job board priority
      const emailResult = await resolveUserEmail(newAssignedTo, currentSubtask.school_id);
      
      if (!emailResult?.email) {
        toast({
          title: "Error", 
          description: "No email address found for the assigned user.",
          variant: "destructive",
        });
        return;
      }

      // Use the queue_email RPC function
      const { data: queueId, error } = await supabase.rpc('queue_email', {
        template_id_param: selectedTemplate,
        recipient_email_param: emailResult.email,
        source_table_param: 'subtasks',
        record_id_param: currentSubtask.id,
        school_id_param: currentSubtask.school_id
      });

      if (error) {
        console.error('Error queuing notification email:', error);
        toast({
          title: "Error",
          description: "Failed to queue notification email.",
          variant: "destructive",
        });
        throw error;
      } else {
        const emailSource = emailResult.source === 'job_role' ? ' (job role email)' : ' (profile email)';
        addSystemComment(`Email sent to ${emailResult.email}${emailSource} [Preview Email](${queueId})`);
        toast({
          title: "Success",
          description: `Notification sent to ${emailResult.email}${emailResult.source === 'job_role' ? ' (job role email)' : ' (profile email)'}`,
        });
      }
    } catch (emailError) {
      console.error('Error sending notification:', emailError);
      toast({
        title: "Error",
        description: "Failed to send notification email.",
        variant: "destructive",
      });
      throw emailError;
    }
  };

  const performSave = async () => {
    // Validate notification requirements
    if (sendNotification && !selectedTemplate) {
      toast({
        title: "Template Required",
        description: "Please select an email template to send notification.",
        variant: "destructive",
      });
      return;
    }

    try {
      const updateData: any = { id: currentSubtask.id };
      
      if (editData.title !== currentSubtask.title) updateData.title = editData.title;
      if (editData.description !== (currentSubtask.description || '')) updateData.description = editData.description || null;
      if (editData.status !== currentSubtask.status) updateData.status = editData.status;
      if (editData.priority !== currentSubtask.priority) updateData.priority = editData.priority;
      
      const newAssignedTo = editData.assigned_to === 'unassigned' ? null : editData.assigned_to;
      if (newAssignedTo !== currentSubtask.assigned_to) updateData.assigned_to = newAssignedTo;
      
      if (editData.due_date !== (currentSubtask.due_date ? new Date(currentSubtask.due_date) : null)) {
        updateData.due_date = editData.due_date ? editData.due_date.toISOString() : null;
      }

      await updateSubtask(updateData);
      
      // Send notification email if requested
      if (sendNotification) {
        await sendNotificationEmail();
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating subtask:', error);
    }
  };

  const handleSave = async () => {
    // Debug logging to track comment state
    console.log('🔍 handleSave called with newComment:', newComment);
    console.log('🔍 newComment trimmed:', newComment.trim());
    console.log('🔍 newComment length:', newComment.length);
    
    // Check for unsaved comment before saving
    if (newComment.trim()) {
      console.log('🔍 Found unsaved comment, showing modal');
      setPendingSaveAction(() => () => performSave());
      setShowUnsavedCommentModal(true);
      return;
    }
    
    console.log('🔍 No unsaved comment, proceeding with save');
    await performSave();
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowConfirmDialog(true);
    } else {
      onOpenChange(false);
    }
  };

  const confirmClose = () => {
    setShowConfirmDialog(false);
    onOpenChange(false);
  };

  const saveAndClose = async () => {
    setShowConfirmDialog(false);
    await handleSave();
  };

  const stayOnForm = () => {
    setShowConfirmDialog(false);
  };

  const handleAddComment = async () => {
    console.log('🔍 handleAddComment called with newComment:', newComment);
    console.log('🔍 newComment trimmed:', newComment.trim());
    
    if (newComment.trim()) {
      console.log('🔍 Adding comment:', newComment.trim());
      await addComment(newComment.trim());
      setNewComment('');
    }
    setShowUnsavedCommentModal(false);
    setPendingSaveAction(null);
  };

  const handleDiscardComment = () => {
    setNewComment('');
    setShowUnsavedCommentModal(false);
    setPendingSaveAction(null);
  };

  const assigneeOptions = [
    { value: 'unassigned', label: 'Unassigned' },
    ...users
      .sort((a, b) => a.last_name.localeCompare(b.last_name))
      .map(user => ({
        value: user.id,
        label: `${user.last_name}, ${user.first_name}`
      }))
  ];

  const handleCompleteSubtask = async () => {
    await updateSubtask({ 
      id: currentSubtask.id, 
      status: getDefaultCompletionStatus(statusOptions),
      completed_at: new Date().toISOString()
    });
    
    // Add system comment
    addSystemComment('Subtask completed');
    
    onOpenChange(false);
  };

  const currentStatusOption = statusOptions.find(option => option.value === editData.status);
  const currentPriorityOption = priorityOptions.find(option => option.value === editData.priority);

  // Determine if Send Notification checkbox should be shown
  const shouldShowNotificationCheckbox = () => {
    // If status is changing to "Need Information" and Task Information Needed rule is enabled, hide checkbox
    const informationNeededRule = rules.find(rule => rule.rule_type === 'task_information_needed');
    if (informationNeededRule?.is_active && editData.status === 'need_information') {
      return false;
    }

    // If status is changing to "Completed" and Task Completed rule is enabled, hide checkbox
    const taskCompletedRule = rules.find(rule => rule.rule_type === 'task_completed');
    if (taskCompletedRule?.is_active && editData.status === 'completed') {
      return false;
    }

    return true;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={hasUnsavedChanges ? handleCancel : onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">
              {currentSubtask.task_number && (
                <span className="text-blue-600 font-mono mr-2">
                  {currentSubtask.task_number} -
                </span>
              )}
              <Input
                value={editData.title}
                onChange={(e) => setEditData({...editData, title: e.target.value})}
                className="text-lg font-semibold border-none p-0 h-auto bg-transparent focus-visible:ring-0"
                disabled={!canEdit}
              />
            </DialogTitle>
            {canEdit && (
              <div className="flex items-center gap-2">
                {!isTaskDone(currentSubtask.status, statusOptions) && (
                  <Button
                    type="button"
                    onClick={handleCompleteSubtask}
                    className="flex items-center gap-2"
                    variant="default"
                  >
                    <Check className="w-4 h-4" />
                    Mark Complete
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isUpdating}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Subtask Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Subtask Information Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Subtask Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Status:</span>
                  {canEdit ? (
                    <Select value={editData.status} onValueChange={(value) => setEditData({...editData, status: value})}>
                      <SelectTrigger className="h-8 w-auto min-w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.filter(s => s.is_active).map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge className={currentStatusOption?.color_class || 'bg-gray-100 text-gray-800'}>
                      {currentStatusOption?.label || editData.status.replace('_', ' ')}
                    </Badge>
                  )}
                </div>                
                <div className="flex items-center gap-2">
                  <Flag className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Priority:</span>
                  {canEdit ? (
                    <Select value={editData.priority} onValueChange={(value) => setEditData({...editData, priority: value})}>
                      <SelectTrigger className="h-8 w-auto min-w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorityOptions.filter(p => p.is_active).map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge className={currentPriorityOption?.color_class || 'bg-gray-100 text-gray-800'}>
                      {currentPriorityOption?.label || editData.priority}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Due Date:</span>
                  {canEdit ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="h-8 text-left">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {editData.due_date ? format(editData.due_date, 'PPP') : 'Set date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={editData.due_date}
                          onSelect={(date) => setEditData({...editData, due_date: date})}
                          disabled={(date) => {
                            const tomorrow = new Date();
                            tomorrow.setDate(tomorrow.getDate() + 1);
                            tomorrow.setHours(0, 0, 0, 0);
                            return date < tomorrow;
                          }}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <span className="text-sm font-medium">
                      {editData.due_date ? format(editData.due_date, 'PPP') : 'No due date'}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Assignment Details Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Assignment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Assigned to:</span>
                  {canEdit && canAssign ? (
                    <Select value={editData.assigned_to} onValueChange={(value) => setEditData({...editData, assigned_to: value})}>
                      <SelectTrigger className="h-8 w-auto min-w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.last_name}, {user.first_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-sm font-medium">
                      {currentSubtask.assigned_to_profile 
                        ? `${currentSubtask.assigned_to_profile.last_name}, ${currentSubtask.assigned_to_profile.first_name}` 
                        : 'Unassigned'}
                    </span>
                  )}
                </div>
                {currentSubtask.assigned_by_profile && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Created by:</span>
                    <span className="text-sm font-medium">
                      {currentSubtask.assigned_by_profile.last_name}, {currentSubtask.assigned_by_profile.first_name}
                    </span>
                  </div>
                )}
                 <div className="flex items-center gap-2">
                   <CalendarIcon className="w-4 h-4 text-gray-500" />
                   <span className="text-sm text-gray-600">Created:</span>
                   <span className="text-sm font-medium">
                     {format(new Date(currentSubtask.created_at), 'PPP')}
                   </span>
                 </div>
                 
                  {/* Send Notification Section */}
                  {canEdit && subtaskTemplates.length > 0 && shouldShowNotificationCheckbox() && (
                   <div className="pt-3 border-t space-y-3">
                     <div className="flex items-center gap-2">
                       <Checkbox
                         id="send-notification-subtask"
                         checked={sendNotification}
                         onCheckedChange={(checked) => {
                           setSendNotification(checked as boolean);
                           if (!checked) setSelectedTemplate('');
                         }}
                       />
                       <label htmlFor="send-notification-subtask" className="text-sm font-medium">
                         Send Notification
                       </label>
                     </div>
                     {sendNotification && (
                       <div className="ml-6">
                         <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                           <SelectTrigger className="h-8 w-full">
                             <SelectValue placeholder="Select template" />
                           </SelectTrigger>
                           <SelectContent>
                             {subtaskTemplates.map((template) => (
                               <SelectItem key={template.id} value={template.id}>
                                 {template.name}
                               </SelectItem>
                             ))}
                           </SelectContent>
                         </Select>
                       </div>
                     )}
                   </div>
                 )}
               </CardContent>
             </Card>
           </div>

          {/* Description */}
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            {canEdit ? (
              <Textarea
                value={editData.description}
                onChange={(e) => setEditData({...editData, description: e.target.value})}
                rows={4}
                placeholder="Detailed description of the subtask..."
              />
            ) : (
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {editData.description || 'No description'}
              </p>
            )}
          </div>

          <Separator />

          <TaskCommentsSection
            comments={comments}
            isAddingComment={isAddingComment}
            onAddComment={addComment}
            newComment={newComment}
            onNewCommentChange={setNewComment}
          />
        </div>
      </DialogContent>
    </Dialog>

    {/* Confirmation Dialog for Unsaved Changes */}
    <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved changes. What would you like to do?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={stayOnForm}>Stay on Form</AlertDialogCancel>
          <Button onClick={confirmClose} variant="outline">
            Close Without Saving
          </Button>
          <AlertDialogAction onClick={saveAndClose}>
            Save Changes
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <UnsavedCommentModal
      open={showUnsavedCommentModal}
      onAddComment={handleAddComment}
      onDiscard={handleDiscardComment}
    />
  </>
  );
};