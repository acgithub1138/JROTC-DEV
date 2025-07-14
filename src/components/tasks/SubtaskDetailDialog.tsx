import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
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
import { Check, Save, X, Calendar as CalendarIcon, Flag, User, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { useSubtaskComments } from '@/hooks/useSubtaskComments';
import { useSubtasks, Subtask } from '@/hooks/useSubtasks';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';
import { useAuth } from '@/contexts/AuthContext';
import { useTaskStatusOptions, useTaskPriorityOptions } from '@/hooks/useTaskOptions';
import { useTablePermissions } from '@/hooks/useTablePermissions';
import { useEmailTemplates } from '@/hooks/email/useEmailTemplates';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { TaskCommentsSection } from './components/TaskCommentsSection';

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
  const { users } = useSchoolUsers();
  const { comments, addComment, addSystemComment, isAddingComment } = useSubtaskComments(subtask.id);
  const { statusOptions } = useTaskStatusOptions();
  const { priorityOptions } = useTaskPriorityOptions();
  const { canEdit: canUpdate, canDelete } = useTablePermissions('tasks');
  const { templates } = useEmailTemplates();
  const { toast } = useToast();
  
  const canAssign = canUpdate; // For now, use update permission for assign
  const [currentSubtask, setCurrentSubtask] = useState(subtask);
  const [sendNotification, setSendNotification] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [editData, setEditData] = useState({
    title: subtask.title,
    description: subtask.description || '',
    status: subtask.status,
    priority: subtask.priority,
    assigned_to: subtask.assigned_to || 'unassigned',
    due_date: subtask.due_date ? new Date(subtask.due_date) : null,
  });

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
    setHasUnsavedChanges(false);
  }, [subtask, subtasks]);

  // Check for unsaved changes
  useEffect(() => {
    const hasChanges = 
      editData.title !== currentSubtask.title ||
      editData.description !== (currentSubtask.description || '') ||
      editData.status !== currentSubtask.status ||
      editData.priority !== currentSubtask.priority ||
      editData.assigned_to !== (currentSubtask.assigned_to || 'unassigned') ||
      (editData.due_date?.toDateString() !== (currentSubtask.due_date ? new Date(currentSubtask.due_date).toDateString() : undefined));
    
    setHasUnsavedChanges(hasChanges);
  }, [editData, currentSubtask]);

  const canEdit = canUpdate || currentSubtask.assigned_to === userProfile?.id;

  // Filter templates for subtasks (using tasks source table since subtasks are part of tasks)
  const subtaskTemplates = templates.filter(template => 
    template.source_table === 'tasks' && template.is_active
  );

  const sendNotificationEmail = async () => {
    if (!selectedTemplate || !currentSubtask.assigned_by) {
      return;
    }

    try {
      // Find the user who created the subtask (assigned_by)
      let createdByUser: { id: string; first_name: string; last_name: string; email: string } | undefined = users.find(u => u.id === currentSubtask.assigned_by);
      
      // If user not found in school users, fetch directly
      if (!createdByUser) {
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email')
          .eq('id', currentSubtask.assigned_by)
          .single();
          
        if (userError || !userData) {
          console.error('Error fetching user data:', userError);
          toast({
            title: "Error",
            description: "Could not find the subtask creator's information.",
            variant: "destructive",
          });
          return;
        }
        
        createdByUser = userData as { id: string; first_name: string; last_name: string; email: string };
      }
      
      if (!createdByUser?.email) {
        toast({
          title: "Error", 
          description: "No email address found for the subtask creator.",
          variant: "destructive",
        });
        return;
      }

      // Use the queue_email RPC function (subtasks will use the subtasks source table)
      const { data: queueId, error } = await supabase.rpc('queue_email', {
        template_id_param: selectedTemplate,
        recipient_email_param: createdByUser.email,
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
        addSystemComment(`Email sent to ${createdByUser.email} [Preview Email](${queueId})`);
        toast({
          title: "Success",
          description: `Notification sent to ${createdByUser.email}`,
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
    try {
      // Validate notification requirements
      if (sendNotification && !selectedTemplate) {
        toast({
          title: "Template Required",
          description: "Please select a template to send notification.",
          variant: "destructive",
        });
        return;
      }

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

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
    } else {
      onOpenChange(false);
    }
  };

  const handleCloseWithoutSaving = () => {
    setShowUnsavedDialog(false);
    onOpenChange(false);
  };

  const handleStayOnForm = () => {
    setShowUnsavedDialog(false);
  };

  const handleSaveAndClose = async () => {
    await handleSave();
    setShowUnsavedDialog(false);
  };

  const assigneeOptions = [
    { value: 'unassigned', label: 'Unassigned' },
    ...users.map(user => ({
      value: user.id,
      label: `${user.last_name}, ${user.first_name}`
    }))
  ];

  const handleCompleteSubtask = async () => {
    await updateSubtask({ 
      id: currentSubtask.id, 
      status: 'done',
      completed_at: new Date().toISOString()
    });
    
    // Add system comment
    addSystemComment('Subtask completed');
    
    onOpenChange(false);
  };

  const currentStatusOption = statusOptions.find(option => option.value === editData.status);
  const currentPriorityOption = priorityOptions.find(option => option.value === editData.priority);

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => {
        if (!isOpen && hasUnsavedChanges) {
          setShowUnsavedDialog(true);
        } else if (!isOpen) {
          onOpenChange(false);
        }
      }}>
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
                {currentSubtask.status !== 'done' && (
                  <Button
                    type="button"
                    onClick={handleCompleteSubtask}
                    className="flex items-center gap-2"
                    variant="default"
                  >
                    <Check className="w-4 h-4" />
                    Complete
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
                
                {/* Send Notification */}
                {canEdit && subtaskTemplates.length > 0 && (
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="send-notification"
                          checked={sendNotification}
                          onCheckedChange={(checked) => setSendNotification(checked === true)}
                        />
                        <label htmlFor="send-notification" className="text-sm">
                          Send notification email
                        </label>
                      </div>
                      
                      {sendNotification && (
                        <div className="flex-1">
                          <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Choose email template" />
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
          />
        </div>
      </DialogContent>
    </Dialog>

    <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved changes that will be lost if you close this dialog. What would you like to do?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={handleCloseWithoutSaving}>
            Close without saving
          </Button>
          <Button variant="secondary" onClick={handleStayOnForm}>
            Stay on form
          </Button>
          <Button onClick={handleSaveAndClose} disabled={isUpdating}>
            Save and close
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};