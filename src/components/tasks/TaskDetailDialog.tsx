
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
import { Check, Save, X, Calendar as CalendarIcon, Flag, User, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { useTaskComments } from '@/hooks/useTaskComments';
import { useTasks } from '@/hooks/useTasks';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';
import { useAuth } from '@/contexts/AuthContext';
import { useTaskStatusOptions, useTaskPriorityOptions } from '@/hooks/useTaskOptions';
import { TaskCommentsSection } from './components/TaskCommentsSection';
import { TaskDetailProps } from './types/TaskDetailTypes';
import { formatFieldChangeComment } from '@/utils/taskCommentUtils';

export const TaskDetailDialog: React.FC<TaskDetailProps> = ({ task, open, onOpenChange, onEdit }) => {
  const { userProfile } = useAuth();
  const { updateTask, tasks, isUpdating } = useTasks();
  const { users } = useSchoolUsers();
  const { comments, addComment, addSystemComment, isAddingComment } = useTaskComments(task.id);
  const { statusOptions } = useTaskStatusOptions();
  const { priorityOptions } = useTaskPriorityOptions();
  const [currentTask, setCurrentTask] = useState(task);
  const [editData, setEditData] = useState({
    title: task.title,
    description: task.description || '',
    status: task.status,
    priority: task.priority,
    assigned_to: task.assigned_to || 'unassigned',
    due_date: task.due_date ? new Date(task.due_date) : null,
  });

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

  const canEdit = userProfile?.role === 'instructor' || 
                  userProfile?.role === 'command_staff' || 
                  currentTask.assigned_to === userProfile?.id;

  const handleSave = async () => {
    try {
      const updateData: any = { id: currentTask.id };
      
      if (editData.title !== currentTask.title) updateData.title = editData.title;
      if (editData.description !== (currentTask.description || '')) updateData.description = editData.description || null;
      if (editData.status !== currentTask.status) updateData.status = editData.status;
      if (editData.priority !== currentTask.priority) updateData.priority = editData.priority;
      
      const newAssignedTo = editData.assigned_to === 'unassigned' ? null : editData.assigned_to;
      if (newAssignedTo !== currentTask.assigned_to) updateData.assigned_to = newAssignedTo;
      
      if (editData.due_date !== (currentTask.due_date ? new Date(currentTask.due_date) : null)) {
        updateData.due_date = editData.due_date ? editData.due_date.toISOString() : null;
      }

      await updateTask(updateData);
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };


  const assigneeOptions = [
    { value: 'unassigned', label: 'Unassigned' },
    ...users.map(user => ({
      value: user.id,
      label: `${user.last_name}, ${user.first_name}`
    }))
  ];

  const handleCompleteTask = async () => {
    await updateTask({ 
      id: currentTask.id, 
      status: 'done',
      completed_at: new Date().toISOString()
    });
    
    // Add system comment
    addSystemComment('Task completed');
    
    onOpenChange(false);
  };

  const currentStatusOption = statusOptions.find(option => option.value === editData.status);
  const currentPriorityOption = priorityOptions.find(option => option.value === editData.priority);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">
              {currentTask.task_number && (
                <span className="text-blue-600 font-mono mr-2">
                  {currentTask.task_number} -
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
                {currentTask.status !== 'done' && (
                  <Button
                    type="button"
                    onClick={handleCompleteTask}
                    className="flex items-center gap-2"
                    variant="default"
                  >
                    <Check className="w-4 h-4" />
                    Complete
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isUpdating}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
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
                  {canEdit && (userProfile?.role === 'instructor' || userProfile?.role === 'command_staff') ? (
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
                placeholder="Detailed description of the task..."
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
  );
};
