
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
import { Check, Save, X, Calendar as CalendarIcon, Flag, User, MessageSquare, Copy } from 'lucide-react';
import { format } from 'date-fns';
import { useTaskComments } from '@/hooks/useTaskComments';
import { useTasks } from '@/hooks/useTasks';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';
import { useSubtasks } from '@/hooks/useSubtasks';
import { useAuth } from '@/contexts/AuthContext';
import { useTaskStatusOptions, useTaskPriorityOptions } from '@/hooks/useTaskOptions';
import { useTaskPermissions } from '@/hooks/useModuleSpecificPermissions';
import { useEmailTemplates } from '@/hooks/email/useEmailTemplates';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { resolveUserEmail } from '@/hooks/useEmailResolution';
import { TaskCommentsSection } from './components/TaskCommentsSection';
import { TaskDetailProps } from './types/TaskDetailTypes';
import { formatFieldChangeComment } from '@/utils/taskCommentUtils';

export const TaskDetailDialog: React.FC<TaskDetailProps> = ({ task, open, onOpenChange, onEdit }) => {
  const { userProfile } = useAuth();
  const { updateTask, duplicateTask, tasks, isUpdating, isDuplicating } = useTasks();
  const { users, isLoading: usersLoading } = useSchoolUsers(true); // Only fetch active users
  const { comments, addComment, addSystemComment, isAddingComment } = useTaskComments(task.id);
  const { subtasks, updateSubtask } = useSubtasks(task.id);
  const { statusOptions } = useTaskStatusOptions();
  const { priorityOptions } = useTaskPriorityOptions();
  const { canView, canUpdate, canUpdateAssigned, canAssign, canCreate } = useTaskPermissions();
  const { templates } = useEmailTemplates();
  const { toast } = useToast();
  const [currentTask, setCurrentTask] = useState(task);
  const canEdit = canUpdate || (canUpdateAssigned && task.assigned_to === userProfile?.id);
  const [isEditing, setIsEditing] = useState(canEdit); // Open in edit mode if user can edit
  const [sendNotification, setSendNotification] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showCompleteConfirmDialog, setShowCompleteConfirmDialog] = useState(false);
  const [editData, setEditData] = useState({
    title: task.title,
    description: task.description || '',
    status: task.status,
    priority: task.priority,
    assigned_to: task.assigned_to || 'unassigned',
    due_date: task.due_date ? new Date(task.due_date) : null,
  });

  // Filter templates for tasks
  const taskTemplates = templates.filter(template => 
    template.is_active && template.source_table === 'tasks'
  );

  // Track changes for unsaved warning
  useEffect(() => {
    const hasChanges = 
      editData.title !== currentTask.title ||
      editData.description !== (currentTask.description || '') ||
      editData.status !== currentTask.status ||
      editData.priority !== currentTask.priority ||
      editData.assigned_to !== (currentTask.assigned_to || 'unassigned') ||
      (editData.due_date?.getTime() !== (currentTask.due_date ? new Date(currentTask.due_date).getTime() : null));
    
    setHasUnsavedChanges(hasChanges || sendNotification);
  }, [editData, currentTask, sendNotification]);

  // Update currentTask and editData when the task prop changes or when tasks are refetched
  useEffect(() => {
    const updatedTask = tasks.find(t => t.id === task.id);
    const taskToUse = updatedTask || task;
    setCurrentTask(taskToUse);
    setEditData({
      title: taskToUse.title,
      description: taskToUse.description || '',
      status: taskToUse.status,
      priority: taskToUse.priority,
      assigned_to: taskToUse.assigned_to || 'unassigned',
      due_date: taskToUse.due_date ? new Date(taskToUse.due_date) : null,
    });
  }, [task, tasks]);

  const sendNotificationEmail = async () => {
    if (!sendNotification || !selectedTemplate || !currentTask.assigned_to) {
      return;
    }

    try {
      // Find the assigned user for name information
      let assignedUser: { id: string; first_name: string; last_name: string } | undefined = users.find(u => u.id === currentTask.assigned_to);
      
      // If user not found in school users, fetch directly
      if (!assignedUser) {
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .eq('id', currentTask.assigned_to)
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
      const emailResult = await resolveUserEmail(currentTask.assigned_to, currentTask.school_id);
      
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
        source_table_param: 'tasks',
        record_id_param: currentTask.id,
        school_id_param: currentTask.school_id
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
        const emailSource = emailResult.source === 'job_board' ? ' (job role email)' : ' (profile email)';
        addSystemComment(`Email sent to ${emailResult.email}${emailSource} [Preview Email](${queueId})`);
        toast({
          title: "Success",
          description: `Notification sent to ${emailResult.email}${emailResult.source === 'job_board' ? ' (job role email)' : ' (profile email)'}`,
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

  const handleSave = async () => {
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
      const updateData: any = { id: currentTask.id };
      const changes: Array<{field: string, oldValue: any, newValue: any}> = [];
      
      if (editData.title !== currentTask.title) {
        updateData.title = editData.title;
        changes.push({ field: 'title', oldValue: currentTask.title, newValue: editData.title });
      }
      
      if (editData.description !== (currentTask.description || '')) {
        updateData.description = editData.description || null;
        changes.push({ field: 'description', oldValue: currentTask.description || '', newValue: editData.description || '' });
      }
      
      if (editData.status !== currentTask.status) {
        updateData.status = editData.status;
        changes.push({ field: 'status', oldValue: currentTask.status, newValue: editData.status });
      }
      
      if (editData.priority !== currentTask.priority) {
        updateData.priority = editData.priority;
        changes.push({ field: 'priority', oldValue: currentTask.priority, newValue: editData.priority });
      }
      
      const newAssignedTo = editData.assigned_to === 'unassigned' ? null : editData.assigned_to;
      if (newAssignedTo !== currentTask.assigned_to) {
        updateData.assigned_to = newAssignedTo;
        changes.push({ field: 'assigned_to', oldValue: currentTask.assigned_to, newValue: newAssignedTo });
      }
      
      const oldDueDate = currentTask.due_date ? new Date(currentTask.due_date) : null;
      const newDueDate = editData.due_date;
      const dueDatesAreDifferent = (oldDueDate && newDueDate && oldDueDate.getTime() !== newDueDate.getTime()) ||
                                   (!oldDueDate && newDueDate) ||
                                   (oldDueDate && !newDueDate);
      
      if (dueDatesAreDifferent) {
        updateData.due_date = newDueDate ? newDueDate.toISOString() : null;
        changes.push({ field: 'due_date', oldValue: oldDueDate, newValue: newDueDate });
      }

      // Update the task
      await updateTask(updateData);
      
      // Add system comments for tracked changes
      for (const change of changes) {
        const commentText = formatFieldChangeComment(
          change.field,
          change.oldValue,
          change.newValue,
          statusOptions,
          priorityOptions,
          users
        );
        addSystemComment(commentText);
      }
      // Send notification email if requested
      if (sendNotification) {
        await sendNotificationEmail();
      }
      
      // Close the modal after successful save
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset edit data to current task values
    setEditData({
      title: currentTask.title,
      description: currentTask.description || '',
      status: currentTask.status,
      priority: currentTask.priority,
      assigned_to: currentTask.assigned_to || 'unassigned',
      due_date: currentTask.due_date ? new Date(currentTask.due_date) : null,
    });
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowConfirmDialog(true);
    } else {
      setIsEditing(false);
      onOpenChange(false);
    }
  };

  const confirmClose = () => {
    setIsEditing(false);
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


  const assigneeOptions = [
    { value: 'unassigned', label: 'Unassigned' },
    ...users
      .sort((a, b) => a.last_name.localeCompare(b.last_name))
      .map(user => ({
        value: user.id,
        label: `${user.last_name}, ${user.first_name}`
      }))
  ];

  const handleCompleteTask = async () => {
    // Check if there are incomplete subtasks
    const incompleteSubtasks = subtasks?.filter(subtask => subtask.status !== 'done') || [];
    
    if (incompleteSubtasks.length > 0) {
      // Show confirmation dialog
      setShowCompleteConfirmDialog(true);
      return;
    }
    
    // No incomplete subtasks, proceed with completion
    await completeTaskAndSubtasks();
  };

  const completeTaskAndSubtasks = async (includeSubtasks = false) => {
    try {
      // Update the main task
      await updateTask({ 
        id: currentTask.id, 
        status: 'done',
        completed_at: new Date().toISOString()
      });
      
      // Update subtasks if requested
      if (includeSubtasks && subtasks) {
        const incompleteSubtasks = subtasks.filter(subtask => subtask.status !== 'done');
        for (const subtask of incompleteSubtasks) {
          await updateSubtask({
            id: subtask.id,
            status: 'done',
            completed_at: new Date().toISOString()
          });
        }
      }
      
      // Add system comment
      const commentText = includeSubtasks && subtasks?.some(s => s.status !== 'done') 
        ? 'Task and all subtasks completed' 
        : 'Task completed';
      addSystemComment(commentText);
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const handleCompleteConfirm = () => {
    setShowCompleteConfirmDialog(false);
    completeTaskAndSubtasks(true);
  };

  const handleCompleteCancel = () => {
    setShowCompleteConfirmDialog(false);
    // Do nothing - don't change the task status
  };

  const handleDuplicateTask = () => {
    if (!currentTask) return;
    
    duplicateTask(currentTask.id, {
      onSuccess: () => {
        onOpenChange(false);
      }
    });
  };

  const currentStatusOption = statusOptions.find(option => option.value === editData.status);
  const currentPriorityOption = priorityOptions.find(option => option.value === editData.priority);

  // If user doesn't have view permission, don't show the dialog content
  if (!canView) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Access Denied</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">You don't have permission to view task details.</p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={hasUnsavedChanges ? handleClose : onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">
              {currentTask.task_number && (
                <span className="text-blue-600 font-mono mr-2">
                  {currentTask.task_number} -
                </span>
              )}
              {isEditing ? (
                <Input
                  value={editData.title}
                  onChange={(e) => setEditData({...editData, title: e.target.value})}
                  className="text-lg font-semibold border-none p-0 h-auto bg-transparent focus-visible:ring-0"
                />
              ) : (
                <span className="text-lg font-semibold">{currentTask.title}</span>
              )}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {canEdit && currentTask.status !== 'done' && (
                <Button
                  type="button"
                  onClick={handleCompleteTask}
                  className="flex items-center gap-2"
                  variant="default"
                >
                  <Check className="w-4 h-4" />
                  Mark Complete
                </Button>
              )}
              
              {canCreate && (
                <Button
                  variant="outline"
                  onClick={handleDuplicateTask}
                  disabled={isDuplicating}
                  className="flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  {isDuplicating ? 'Duplicating...' : 'Duplicate'}
                </Button>
              )}
              {isEditing && canEdit && (
                <>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isUpdating}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Task Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Task Information Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Task Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                 <div className="flex items-center gap-2">
                   <Flag className="w-4 h-4 text-gray-500" />
                   <span className="text-sm text-gray-600">Priority:</span>
                    {isEditing && canEdit ? (
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
                       {currentPriorityOption?.label || currentTask.priority}
                     </Badge>
                   )}
                 </div>
                 <div className="flex items-center gap-2">
                   <MessageSquare className="w-4 h-4 text-gray-500" />
                   <span className="text-sm text-gray-600">Status:</span>
                    {isEditing && canEdit ? (
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
                       {currentStatusOption?.label || currentTask.status.replace('_', ' ')}
                     </Badge>
                   )}
                 </div>
                 <div className="flex items-center gap-2">
                   <CalendarIcon className="w-4 h-4 text-gray-500" />
                   <span className="text-sm text-gray-600">Due Date:</span>
                   {isEditing && canEdit ? (
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
                       {currentTask.due_date ? format(new Date(currentTask.due_date), 'PPP') : 'No due date'}
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
                     {isEditing && canEdit && canAssign ? (
                      usersLoading ? (
                        <div className="h-8 w-32 bg-muted animate-pulse rounded" />
                      ) : (
                        <Select value={editData.assigned_to} onValueChange={(value) => setEditData({...editData, assigned_to: value})}>
                          <SelectTrigger className="h-8 w-auto min-w-[120px]">
                            <SelectValue placeholder={usersLoading ? "Loading..." : "Select user"} />
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
                      )
                    ) : (
                      <span className="text-sm font-medium">
                        {currentTask.assigned_to_profile 
                          ? `${currentTask.assigned_to_profile.last_name}, ${currentTask.assigned_to_profile.first_name}` 
                          : 'Unassigned'}
                      </span>
                    )}
                 </div>
                {currentTask.assigned_by_profile && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Created by:</span>
                    <span className="text-sm font-medium">
                      {currentTask.assigned_by_profile.last_name}, {currentTask.assigned_by_profile.first_name}
                    </span>
                  </div>
                )}
                 <div className="flex items-center gap-2">
                   <CalendarIcon className="w-4 h-4 text-gray-500" />
                   <span className="text-sm text-gray-600">Created:</span>
                   <span className="text-sm font-medium">
                     {format(new Date(currentTask.created_at), 'PPP')}
                   </span>
                 </div>
                 
                 {/* Send Notification Section */}
                 {isEditing && canEdit && taskTemplates.length > 0 && (
                   <div className="pt-3 border-t space-y-3">
                     <div className="flex items-center gap-2">
                       <Checkbox
                         id="send-notification"
                         checked={sendNotification}
                         onCheckedChange={(checked) => {
                           setSendNotification(checked as boolean);
                           if (!checked) setSelectedTemplate('');
                         }}
                       />
                       <label htmlFor="send-notification" className="text-sm font-medium">
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
                             {taskTemplates.map((template) => (
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
            {isEditing && canEdit ? (
              <Textarea
                value={editData.description}
                onChange={(e) => setEditData({...editData, description: e.target.value})}
                rows={4}
                placeholder="Detailed description of the task..."
              />
            ) : (
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {currentTask.description || 'No description'}
              </p>
            )}
          </div>

          <Separator />

          <TaskCommentsSection
            comments={comments}
            isAddingComment={isAddingComment}
            onAddComment={addComment}
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

    {/* Confirmation Dialog for Completing Task with Incomplete Subtasks */}
    <AlertDialog open={showCompleteConfirmDialog} onOpenChange={setShowCompleteConfirmDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Complete Task with Subtasks</AlertDialogTitle>
          <AlertDialogDescription>
            This task has incomplete subtasks. Do you want to complete the subtasks too?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCompleteCancel}>No</AlertDialogCancel>
          <AlertDialogAction onClick={handleCompleteConfirm}>
            Yes, Complete All
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>
  );
};
