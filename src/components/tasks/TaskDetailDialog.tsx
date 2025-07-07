
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Check, Save, X } from 'lucide-react';
import { useTaskComments } from '@/hooks/useTaskComments';
import { useTasks } from '@/hooks/useTasks';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';
import { useAuth } from '@/contexts/AuthContext';
import { useTaskStatusOptions, useTaskPriorityOptions } from '@/hooks/useTaskOptions';
import { TaskCommentsSection } from './components/TaskCommentsSection';
import { TaskDetailProps } from './types/TaskDetailTypes';

export const TaskDetailDialog: React.FC<TaskDetailProps> = ({ task, open, onOpenChange, onEdit }) => {
  const { userProfile } = useAuth();
  const { updateTask, isUpdating } = useTasks();
  const { users } = useSchoolUsers();
  const { comments, addComment, isAddingComment } = useTaskComments(task.id);
  const { statusOptions } = useTaskStatusOptions();
  const { priorityOptions } = useTaskPriorityOptions();
  
  const [editData, setEditData] = useState({
    title: task.title,
    description: task.description || '',
    status: task.status,
    priority: task.priority,
    assigned_to: task.assigned_to || 'unassigned',
    due_date: task.due_date || '',
  });

  const canEdit = userProfile?.role === 'instructor' || 
                  userProfile?.role === 'command_staff' || 
                  task.assigned_to === userProfile?.id;

  const handleSave = async () => {
    try {
      const updateData: any = {
        id: task.id,
        title: editData.title,
        description: editData.description || null,
        status: editData.status,
        priority: editData.priority,
        assigned_to: editData.assigned_to === 'unassigned' ? null : editData.assigned_to,
        due_date: editData.due_date || null,
      };
      
      await updateTask(updateData);
      onOpenChange(false); // Close modal after successful save
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  // Update the form state when the task prop changes (after successful save and refetch)
  useEffect(() => {
    setEditData({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      assigned_to: task.assigned_to || 'unassigned',
      due_date: task.due_date || '',
    });
  }, [task]);

  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleCompleteTask = async () => {
    await updateTask({ 
      id: task.id, 
      status: 'done',
      completed_at: new Date().toISOString()
    });
    
    onOpenChange(false);
  };

  const getDialogTitle = () => {
    if (task.task_number) {
      return `${task.task_number}`;
    }
    return 'Task Details';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {getDialogTitle()}
            </DialogTitle>
            <div className="flex gap-2">
              {task.status !== 'done' && (
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
              {canEdit && (
                <>
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
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Task Details */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Title</h3>
              <Input
                value={editData.title}
                onChange={(e) => setEditData({...editData, title: e.target.value})}
                className="text-lg"
                disabled={!canEdit}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Status</h3>
                <Select
                  value={editData.status}
                  onValueChange={(value) => setEditData({...editData, status: value})}
                  disabled={!canEdit}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Priority</h3>
                <Select
                  value={editData.priority}
                  onValueChange={(value) => setEditData({...editData, priority: value})}
                  disabled={!canEdit}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Assigned To</h3>
                <Select
                  value={editData.assigned_to}
                  onValueChange={(value) => setEditData({...editData, assigned_to: value})}
                  disabled={!canEdit}
                >
                  <SelectTrigger>
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
              </div>

              <div>
                <h3 className="font-semibold mb-2">Due Date</h3>
                <Input
                  type="date"
                  value={editData.due_date ? new Date(editData.due_date).toISOString().split('T')[0] : ''}
                  onChange={(e) => setEditData({...editData, due_date: e.target.value})}
                  disabled={!canEdit}
                />
              </div>

              <div>
                <h3 className="font-semibold mb-2">Created</h3>
                <p className="text-sm">{new Date(task.created_at).toLocaleString()}</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Last Updated</h3>
                <p className="text-sm">{new Date(task.updated_at).toLocaleString()}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <Textarea
                value={editData.description}
                onChange={(e) => setEditData({...editData, description: e.target.value})}
                rows={4}
                placeholder="Task description..."
                disabled={!canEdit}
              />
            </div>
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
