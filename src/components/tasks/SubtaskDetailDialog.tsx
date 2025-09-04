import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Check, Save, X, Calendar as CalendarIcon, Flag, User, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
import { formatTimeForDisplay, TIME_FORMATS } from '@/utils/timeDisplayUtils';
import { useSubtaskComments } from '@/hooks/useSubtaskComments';
import { useSubtasks, Subtask } from '@/hooks/useSubtasks';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';
import { useAuth } from '@/contexts/AuthContext';
import { useTaskStatusOptions, useTaskPriorityOptions } from '@/hooks/useTaskOptions';
import { useTaskPermissions } from '@/hooks/useModuleSpecificPermissions';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

import { getDefaultCompletionStatus, isTaskDone } from '@/utils/taskStatusUtils';
import { TaskCommentsSection } from './components/TaskCommentsSection';
import { UnsavedCommentModal } from './components/UnsavedCommentModal';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
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
  const { timezone } = useSchoolTimezone();
  const {
    userProfile
  } = useAuth();
  const {
    updateSubtask,
    subtasks,
    isUpdating
  } = useSubtasks(subtask.parent_task_id);
  const {
    users
  } = useSchoolUsers(true); // Only fetch active users
  const {
    comments,
    addComment,
    addSystemComment,
    isAddingComment
  } = useSubtaskComments(subtask.id);
  const {
    statusOptions
  } = useTaskStatusOptions();
  const {
    priorityOptions
  } = useTaskPriorityOptions();
  const {
    canView,
    canUpdate,
    canUpdateAssigned,
    canAssign,
    canDelete,
    canCreate
  } = useTaskPermissions();
  
  // Add debug logging to track permission values  
  console.log('🔍 SubtaskDetailDialog permissions:', { 
    canView,
    canUpdate,
    canUpdateAssigned,
    canAssign,
    canDelete,
    canCreate,
    userRole: userProfile?.role 
  });
  const {
    toast
  } = useToast();
  // canAssign is now provided directly by useTaskPermissions()
  const [currentSubtask, setCurrentSubtask] = useState(subtask);
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
    due_date: subtask.due_date ? new Date(subtask.due_date) : null
  });


  // Track changes for unsaved warning
  useEffect(() => {
    const hasChanges = editData.title !== currentSubtask.title || editData.description !== (currentSubtask.description || '') || editData.status !== currentSubtask.status || editData.priority !== currentSubtask.priority || editData.assigned_to !== (currentSubtask.assigned_to || 'unassigned') || editData.due_date?.getTime() !== (currentSubtask.due_date ? new Date(currentSubtask.due_date).getTime() : null);
    setHasUnsavedChanges(hasChanges);
  }, [editData, currentSubtask]);

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
      due_date: subtaskToUse.due_date ? new Date(subtaskToUse.due_date) : null
    });
  }, [subtask, subtasks]);
  const canEdit = canUpdate || currentSubtask.assigned_to === userProfile?.id;
  const performSave = async () => {
    try {
      const updateData: any = {
        id: currentSubtask.id
      };
      
      // Track changes for system comments
      const changes: Array<{field: string, oldValue: any, newValue: any}> = [];
      
      if (editData.title !== currentSubtask.title) {
        updateData.title = editData.title;
        changes.push({field: 'title', oldValue: currentSubtask.title, newValue: editData.title});
      }
      if (editData.description !== (currentSubtask.description || '')) {
        updateData.description = editData.description || null;
        changes.push({field: 'description', oldValue: currentSubtask.description, newValue: editData.description});
      }
      if (editData.status !== currentSubtask.status) {
        updateData.status = editData.status;
        changes.push({field: 'status', oldValue: currentSubtask.status, newValue: editData.status});
      }
      if (editData.priority !== currentSubtask.priority) {
        updateData.priority = editData.priority;
        changes.push({field: 'priority', oldValue: currentSubtask.priority, newValue: editData.priority});
      }
      const newAssignedTo = editData.assigned_to === 'unassigned' ? null : editData.assigned_to;
      if (newAssignedTo !== currentSubtask.assigned_to) {
        updateData.assigned_to = newAssignedTo;
        changes.push({field: 'assigned_to', oldValue: currentSubtask.assigned_to, newValue: newAssignedTo});
      }
      if (editData.due_date !== (currentSubtask.due_date ? new Date(currentSubtask.due_date) : null)) {
        updateData.due_date = editData.due_date ? editData.due_date.toISOString() : null;
        changes.push({field: 'due_date', oldValue: currentSubtask.due_date, newValue: editData.due_date});
      }
      
      await updateSubtask(updateData);

      // Add system comments for all changes
      if (changes.length > 0) {
        const { formatSubtaskFieldChangeComment } = await import('@/utils/subtaskCommentUtils');
        for (const change of changes) {
          const commentText = formatSubtaskFieldChangeComment(
            change.field,
            change.oldValue,
            change.newValue,
            statusOptions,
            priorityOptions,
            users
          );
          addSystemComment(commentText);
        }
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
  const handleDiscardChanges = () => {
    setShowConfirmDialog(false);
    onOpenChange(false);
  };
  const handleContinueEditing = () => {
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
  const assigneeOptions = [{
    value: 'unassigned',
    label: 'Unassigned'
  }, ...users.sort((a, b) => a.last_name.localeCompare(b.last_name)).map(user => ({
    value: user.id,
    label: `${user.last_name}, ${user.first_name}`
  }))];
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

  return <>
      <Dialog open={open} onOpenChange={hasUnsavedChanges ? handleCancel : onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">
              {currentSubtask.task_number && <span className="text-blue-600 font-mono mr-2">
                  {currentSubtask.task_number} -
                </span>}
              <Input value={editData.title} onChange={e => setEditData({
                ...editData,
                title: e.target.value
              })} className="text-lg font-semibold border-none p-0 h-auto bg-transparent focus-visible:ring-0" disabled={!canEdit} />
            </DialogTitle>
            {canEdit && <div className="flex items-center gap-2">
                {!isTaskDone(currentSubtask.status, statusOptions) && <Button type="button" onClick={handleCompleteSubtask} className="flex items-center gap-2" variant="default">
                    <Check className="w-4 h-4" />
                    Mark Complete
                  </Button>}
                <Button size="sm" onClick={handleSave} disabled={isUpdating}>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>}
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
                  {canEdit ? <Select value={editData.status} onValueChange={value => setEditData({
                    ...editData,
                    status: value
                  })}>
                      <SelectTrigger className="h-8 w-auto min-w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.filter(s => s.is_active).map(option => <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>)}
                      </SelectContent>
                    </Select> : <Badge className={currentStatusOption?.color_class || 'bg-gray-100 text-gray-800'}>
                      {currentStatusOption?.label || editData.status.replace('_', ' ')}
                    </Badge>}
                </div>                
                <div className="flex items-center gap-2">
                  <Flag className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Priority:</span>
                  {canEdit ? <Select value={editData.priority} onValueChange={value => setEditData({
                    ...editData,
                    priority: value
                  })}>
                      <SelectTrigger className="h-8 w-auto min-w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorityOptions.filter(p => p.is_active).map(option => <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>)}
                      </SelectContent>
                    </Select> : <Badge className={currentPriorityOption?.color_class || 'bg-gray-100 text-gray-800'}>
                      {currentPriorityOption?.label || editData.priority}
                    </Badge>}
                </div>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Due Date:</span>
                   {canEdit ? <Input type="date" value={editData.due_date ? format(editData.due_date, 'yyyy-MM-dd') : ''} onChange={e => {
                    const dateValue = e.target.value;
                    if (dateValue) {
                      // Create date object from input value with validation
                      const date = new Date(dateValue + 'T12:00:00');
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      tomorrow.setHours(0, 0, 0, 0);
                      if (date >= tomorrow) {
                        setEditData({
                          ...editData,
                          due_date: date
                        });
                      }
                    } else {
                      setEditData({
                        ...editData,
                        due_date: null
                      });
                    }
                  }} min={(() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    return format(tomorrow, 'yyyy-MM-dd');
                  })()} className="h-8 w-auto min-w-[150px]" /> : <span className="text-sm font-medium">
                       {editData.due_date ? format(editData.due_date, 'PPP') : 'No due date'}
                     </span>}
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
                  {canEdit && canAssign ? <Select value={editData.assigned_to} onValueChange={value => setEditData({
                    ...editData,
                    assigned_to: value
                  })}>
                      <SelectTrigger className="h-8 w-auto min-w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {users.map(user => <SelectItem key={user.id} value={user.id}>
                            {user.last_name}, {user.first_name}
                          </SelectItem>)}
                      </SelectContent>
                    </Select> : <span className="text-sm font-medium">
                      {currentSubtask.assigned_to_profile ? `${currentSubtask.assigned_to_profile.last_name}, ${currentSubtask.assigned_to_profile.first_name}` : 'Unassigned'}
                    </span>}
                </div>
                {currentSubtask.assigned_by_profile && <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Created by:</span>
                    <span className="text-sm font-medium">
                      {currentSubtask.assigned_by_profile.last_name}, {currentSubtask.assigned_by_profile.first_name}
                    </span>
                  </div>}
                 <div className="flex items-center gap-2">
                   <CalendarIcon className="w-4 h-4 text-gray-500" />
                   <span className="text-sm text-gray-600">Created:</span>
                    <span className="text-sm font-medium">
                      {formatTimeForDisplay(currentSubtask.created_at, TIME_FORMATS.FULL_DATE, timezone)}
                    </span>
                 </div>
                 
               </CardContent>
             </Card>
           </div>

          {/* Description */}
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            {canEdit ? <Textarea value={editData.description} onChange={e => setEditData({
              ...editData,
              description: e.target.value
            })} rows={4} placeholder="Detailed description of the subtask..." /> : <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {editData.description || 'No description'}
              </p>}
          </div>

          <Separator />

          <TaskCommentsSection comments={comments} isAddingComment={isAddingComment} onAddComment={addComment} newComment={newComment} onNewCommentChange={setNewComment} />
        </div>
      </DialogContent>
    </Dialog>

    <UnsavedChangesDialog
      open={showConfirmDialog}
      onOpenChange={setShowConfirmDialog}
      onDiscard={handleDiscardChanges}
      onCancel={handleContinueEditing}
    />

    <UnsavedCommentModal open={showUnsavedCommentModal} onAddComment={handleAddComment} onDiscard={handleDiscardComment} />
  </>;
};