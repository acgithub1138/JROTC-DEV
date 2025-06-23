
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Edit, Calendar as CalendarIcon, User, Flag, MessageSquare, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { Task } from '@/hooks/useTasks';
import { useTaskComments } from '@/hooks/useTaskComments';
import { useTasks } from '@/hooks/useTasks';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';
import { useAuth } from '@/contexts/AuthContext';
import { useTaskStatusOptions, useTaskPriorityOptions } from '@/hooks/useTaskOptions';

interface TaskDetailProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (task: Task) => void;
}

interface EditState {
  field: string | null;
  value: any;
}

export const TaskDetail: React.FC<TaskDetailProps> = ({ task, open, onOpenChange, onEdit }) => {
  const { userProfile } = useAuth();
  const { updateTask } = useTasks();
  const { users } = useSchoolUsers();
  const { comments, addComment, isAddingComment } = useTaskComments(task.id);
  const { statusOptions } = useTaskStatusOptions();
  const { priorityOptions } = useTaskPriorityOptions();
  const [newComment, setNewComment] = useState('');
  const [editState, setEditState] = useState<EditState>({ field: null, value: null });

  const canEdit = userProfile?.role === 'instructor' || 
                  userProfile?.role === 'command_staff' || 
                  task.assigned_to === userProfile?.id;

  const handleAddComment = () => {
    if (newComment.trim()) {
      addComment(newComment.trim());
      setNewComment('');
    }
  };

  const startEdit = (field: string, currentValue: any) => {
    setEditState({ field, value: currentValue });
  };

  const cancelEdit = () => {
    setEditState({ field: null, value: null });
  };

  const saveEdit = async (field: string) => {
    if (!editState.field) return;

    const updateData: any = { id: task.id };
    
    if (field === 'due_date') {
      updateData.due_date = editState.value ? editState.value.toISOString() : null;
    } else {
      updateData[field] = editState.value;
    }

    try {
      await updateTask(updateData);
      cancelEdit();
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const renderEditableField = (field: string, currentValue: any, displayValue: string, type: 'text' | 'select' | 'date' = 'text', options?: any[]) => {
    const isEditing = editState.field === field;

    if (!canEdit) {
      return <span className="text-sm font-medium">{displayValue}</span>;
    }

    if (isEditing) {
      if (type === 'text') {
        return (
          <div className="flex items-center gap-2">
            <Input
              value={editState.value || ''}
              onChange={(e) => setEditState({ ...editState, value: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEdit(field);
                if (e.key === 'Escape') cancelEdit();
              }}
              className="h-8"
              autoFocus
            />
            <Button size="sm" variant="ghost" onClick={() => saveEdit(field)}>
              <Check className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={cancelEdit}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        );
      }

      if (type === 'select' && options) {
        return (
          <Select
            value={editState.value}
            onValueChange={(value) => {
              setEditState({ ...editState, value });
              setTimeout(() => {
                updateTask({ id: task.id, [field]: value });
                cancelEdit();
              }, 100);
            }}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }

      if (type === 'date') {
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-8 text-left">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {editState.value ? format(editState.value, 'MMM d, yyyy') : 'Set date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={editState.value}
                onSelect={(date) => {
                  setEditState({ ...editState, value: date });
                  setTimeout(() => {
                    updateTask({ id: task.id, due_date: date ? date.toISOString() : null });
                    cancelEdit();
                  }, 100);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );
      }
    }

    return (
      <div
        className="cursor-pointer hover:bg-gray-50 rounded px-2 py-1 -mx-2 -my-1 flex items-center gap-2 group"
        onClick={() => startEdit(field, currentValue)}
      >
        <span className="text-sm font-medium">{displayValue}</span>
        <Edit className="w-3 h-3 opacity-0 group-hover:opacity-100" />
      </div>
    );
  };

  const renderEditableDescription = () => {
    const isEditing = editState.field === 'description';

    if (!canEdit) {
      return <p className="text-sm text-gray-700 whitespace-pre-wrap">{task.description || 'No description'}</p>;
    }

    if (isEditing) {
      return (
        <div className="space-y-2">
          <Textarea
            value={editState.value || ''}
            onChange={(e) => setEditState({ ...editState, value: e.target.value })}
            rows={4}
            autoFocus
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={() => saveEdit('description')}>
              <Check className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={cancelEdit}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div
        className="cursor-pointer hover:bg-gray-50 rounded p-2 -mx-2 -my-2 group"
        onClick={() => startEdit('description', task.description)}
      >
        <p className="text-sm text-gray-700 whitespace-pre-wrap">
          {task.description || 'Click to add description...'}
        </p>
        <Edit className="w-3 h-3 opacity-0 group-hover:opacity-100 mt-1" />
      </div>
    );
  };

  const assigneeOptions = [
    { value: '', label: 'Unassigned' },
    ...users.map(user => ({
      value: user.id,
      label: `${user.first_name} ${user.last_name}`
    }))
  ];

  // Get the current status and priority options for display
  const currentStatusOption = statusOptions.find(option => option.value === task.status);
  const currentPriorityOption = priorityOptions.find(option => option.value === task.priority);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {renderEditableField('title', task.title, task.title)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Task Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Task Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Flag className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Priority:</span>
                  {editState.field === 'priority' ? (
                    renderEditableField('priority', task.priority, '', 'select', priorityOptions)
                  ) : (
                    <div className="flex items-center gap-2">
                      <Badge className={currentPriorityOption?.color_class || 'bg-gray-100 text-gray-800'}>
                        {currentPriorityOption?.label || task.priority}
                      </Badge>
                      {canEdit && (
                        <button onClick={() => startEdit('priority', task.priority)}>
                          <Edit className="w-3 h-3 opacity-50 hover:opacity-100" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Status:</span>
                  {editState.field === 'status' ? (
                    renderEditableField('status', task.status, '', 'select', statusOptions)
                  ) : (
                    <div className="flex items-center gap-2">
                      <Badge className={currentStatusOption?.color_class || 'bg-gray-100 text-gray-800'}>
                        {currentStatusOption?.label || task.status.replace('_', ' ')}
                      </Badge>
                      {canEdit && (
                        <button onClick={() => startEdit('status', task.status)}>
                          <Edit className="w-3 h-3 opacity-50 hover:opacity-100" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Due Date:</span>
                  {renderEditableField(
                    'due_date',
                    task.due_date ? new Date(task.due_date) : null,
                    task.due_date ? format(new Date(task.due_date), 'PPP') : 'No due date',
                    'date'
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Assignment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Assigned to:</span>
                  {userProfile?.role === 'instructor' || userProfile?.role === 'command_staff' ? (
                    renderEditableField(
                      'assigned_to',
                      task.assigned_to,
                      task.assigned_to_profile
                        ? `${task.assigned_to_profile.first_name} ${task.assigned_to_profile.last_name}`
                        : 'Unassigned',
                      'select',
                      assigneeOptions
                    )
                  ) : (
                    <span className="text-sm font-medium">
                      {task.assigned_to_profile
                        ? `${task.assigned_to_profile.first_name} ${task.assigned_to_profile.last_name}`
                        : 'Unassigned'}
                    </span>
                  )}
                </div>
                {task.assigned_by_profile && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Assigned by:</span>
                    <span className="text-sm font-medium">
                      {task.assigned_by_profile.first_name} {task.assigned_by_profile.last_name}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Created:</span>
                  <span className="text-sm font-medium">
                    {format(new Date(task.created_at), 'PPP')}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Task Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Description</CardTitle>
            </CardHeader>
            <CardContent>
              {renderEditableDescription()}
            </CardContent>
          </Card>

          <Separator />

          {/* Comments Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Activity & Comments</h3>
            
            {/* Add Comment */}
            <div className="mb-6">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
              />
              <div className="flex justify-end mt-2">
                <Button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || isAddingComment}
                  size="sm"
                >
                  Add Comment
                </Button>
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {comment.user_profile.first_name} {comment.user_profile.last_name}
                      </span>
                      {comment.is_system_comment && (
                        <Badge variant="secondary" className="text-xs">System</Badge>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {format(new Date(comment.created_at), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {comment.comment_text}
                  </p>
                </div>
              ))}
              
              {comments.length === 0 && (
                <p className="text-center text-gray-500 py-8">
                  No comments yet. Be the first to add one!
                </p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
