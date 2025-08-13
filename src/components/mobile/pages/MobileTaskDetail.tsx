import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { 
  ArrowLeft, 
  Edit, 
  Save, 
  X, 
  Check, 
  User, 
  Calendar,
  Flag,
  MessageSquare,
  Copy
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useTasks } from '@/hooks/useTasks';
import { useTaskComments } from '@/hooks/useTaskComments';
import { useTaskStatusOptions, useTaskPriorityOptions } from '@/hooks/useTaskOptions';
import { useTaskPermissions } from '@/hooks/useModuleSpecificPermissions';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';
import { useToast } from '@/hooks/use-toast';
import { isTaskDone, getDefaultCompletionStatus } from '@/utils/taskStatusUtils';
import { MobileTaskForm } from './MobileTaskForm';

export const MobileTaskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { tasks, updateTask, duplicateTask, isUpdating } = useTasks();
  const { statusOptions } = useTaskStatusOptions();
  const { priorityOptions } = useTaskPriorityOptions();
  const { canView, canUpdate, canUpdateAssigned, canCreate } = useTaskPermissions();
  const { users } = useSchoolUsers(true);
  const { comments, addComment, addSystemComment, isAddingComment } = useTaskComments(id || '');
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [newComment, setNewComment] = useState('');

  const task = tasks.find(t => t.id === id);

  useEffect(() => {
    if (!canView) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to view task details.",
        variant: "destructive"
      });
      navigate('/mobile/tasks');
    }
  }, [canView, navigate, toast]);

  if (!task && id) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Task not found</p>
            <Button 
              variant="outline" 
              onClick={() => navigate('/mobile/tasks')}
              className="mt-4"
            >
              Back to Tasks
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading task...</p>
          </div>
        </div>
      </div>
    );
  }

  const canEdit = canUpdate || (canUpdateAssigned && task.assigned_to === userProfile?.id);
  const isCompleted = isTaskDone(task.status, statusOptions);

  const getStatusBadge = (status: string) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    if (!statusOption) return null;
    
    return (
      <Badge variant="outline" className={cn('text-xs', statusOption.color_class)}>
        {statusOption.label.toUpperCase()}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityOption = priorityOptions.find(opt => opt.value === priority);
    if (!priorityOption) return null;
    
    return (
      <Badge className={cn('text-xs', priorityOption.color_class)}>
        {priorityOption.label.toUpperCase()}
      </Badge>
    );
  };

  const getAssignedToName = () => {
    if (task.assigned_to_profile) {
      return `${task.assigned_to_profile.last_name}, ${task.assigned_to_profile.first_name}`;
    }
    return 'Unassigned';
  };

  const handleCompleteTask = async () => {
    if (isCompleted) return;
    setShowCompleteDialog(true);
  };

  const confirmComplete = async () => {
    try {
      await updateTask({
        id: task.id,
        status: getDefaultCompletionStatus(statusOptions),
        completed_at: new Date().toISOString()
      });
      
      addSystemComment('Task completed');
      setShowCompleteDialog(false);
      
      toast({
        title: "Success",
        description: "Task marked as completed",
      });
    } catch (error) {
      console.error('Error completing task:', error);
      toast({
        title: "Error",
        description: "Failed to complete task",
        variant: "destructive"
      });
    }
  };

  const handleDuplicate = () => {
    if (!canCreate) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to create tasks.",
        variant: "destructive"
      });
      return;
    }

    duplicateTask(task.id, {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Task duplicated successfully",
        });
      }
    });
  };

  const handleAddComment = async (comment: string) => {
    await addComment(comment);
  };

  const handleEditSuccess = () => {
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <MobileTaskForm 
        task={task}
        onCancel={() => setIsEditing(false)}
        onSuccess={handleEditSuccess}
      />
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-1 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/mobile/tasks')}
                className="mr-2 p-2 flex-shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-semibold truncate">
                  {task.task_number && `${task.task_number} - `}{task.title}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-2">
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 pb-20">
          {/* Task Info Card */}
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Task Information</CardTitle>
                <div className="flex gap-2">
                  {getPriorityBadge(task.priority)}
                  {getStatusBadge(task.status)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {task.description && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
                  <p className="text-sm">{task.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Assigned to</p>
                    <p className="text-sm font-medium">{getAssignedToName()}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Due Date</p>
                    <p className="text-sm font-medium">
                      {task.due_date ? format(new Date(task.due_date), 'PPP') : 'No due date'}
                    </p>
                  </div>
                </div>

                {task.completed_at && (
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-xs text-muted-foreground">Completed</p>
                      <p className="text-sm font-medium">
                        {format(new Date(task.completed_at), 'PPP')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {!isCompleted && canEdit && (
              <Button
                onClick={handleCompleteTask}
                className="flex items-center gap-2"
                disabled={isUpdating}
              >
                <Check className="h-4 w-4" />
                Complete Task
              </Button>
            )}
            
            {canCreate && (
              <Button
                variant="outline"
                onClick={handleDuplicate}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Duplicate
              </Button>
            )}
          </div>

          {/* Comments Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Comments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Add Comment Form - moved to top */}
                <div className="space-y-3 pb-4 border-b border-border">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full min-h-[80px] p-3 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <Button
                    onClick={() => {
                      if (newComment.trim()) {
                        handleAddComment(newComment.trim());
                        setNewComment('');
                      }
                    }}
                    disabled={!newComment.trim() || isAddingComment}
                    className="w-full"
                  >
                    {isAddingComment ? 'Adding...' : 'Add Comment'}
                  </Button>
                </div>

                {/* Comments List */}
                {comments.map((comment) => (
                  <div key={comment.id} className={cn(
                    "p-3 rounded-lg",
                    comment.is_system_comment ? "bg-muted/50" : "bg-background border"
                  )}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="text-sm font-medium">
                        {comment.is_system_comment ? 'System' : 
                          comment.user_profile ? 
                            `${comment.user_profile.last_name}, ${comment.user_profile.first_name}` : 
                            'Unknown User'
                        }
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(comment.created_at), 'MMM d, h:mm a')}
                      </div>
                    </div>
                    <div className="text-sm">
                      {comment.comment_text}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Complete Task Confirmation */}
      <AlertDialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark this task as completed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmComplete}>
              Complete Task
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};