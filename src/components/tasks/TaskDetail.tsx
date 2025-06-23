
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Edit, Calendar, User, Flag, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { Task } from '@/hooks/useTasks';
import { useTaskComments } from '@/hooks/useTaskComments';
import { useAuth } from '@/contexts/AuthContext';

interface TaskDetailProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (task: Task) => void;
}

const priorityColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
  critical: 'bg-purple-100 text-purple-800',
};

const statusColors = {
  not_started: 'bg-gray-100 text-gray-800',
  working_on_it: 'bg-blue-100 text-blue-800',
  stuck: 'bg-red-100 text-red-800',
  done: 'bg-green-100 text-green-800',
  pending: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

export const TaskDetail: React.FC<TaskDetailProps> = ({ task, open, onOpenChange, onEdit }) => {
  const { userProfile } = useAuth();
  const { comments, addComment, isAddingComment } = useTaskComments(task.id);
  const [newComment, setNewComment] = useState('');

  const canEdit = userProfile?.role === 'instructor' || 
                  userProfile?.role === 'command_staff' || 
                  task.assigned_to === userProfile?.id;

  const handleAddComment = () => {
    if (newComment.trim()) {
      addComment(newComment.trim());
      setNewComment('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">{task.title}</DialogTitle>
            {canEdit && (
              <Button variant="outline" size="sm" onClick={() => onEdit(task)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
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
                  <Badge className={priorityColors[task.priority as keyof typeof priorityColors]}>
                    {task.priority}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Status:</span>
                  <Badge className={statusColors[task.status as keyof typeof statusColors]}>
                    {task.status.replace('_', ' ')}
                  </Badge>
                </div>
                {task.due_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Due Date:</span>
                    <span className="text-sm font-medium">
                      {format(new Date(task.due_date), 'PPP')}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Assignment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {task.assigned_to_profile && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Assigned to:</span>
                    <span className="text-sm font-medium">
                      {task.assigned_to_profile.first_name} {task.assigned_to_profile.last_name}
                    </span>
                  </div>
                )}
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
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Created:</span>
                  <span className="text-sm font-medium">
                    {format(new Date(task.created_at), 'PPP')}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Task Description */}
          {task.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{task.description}</p>
              </CardContent>
            </Card>
          )}

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
