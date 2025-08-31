import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTasks } from '@/hooks/useTasks';
import { useTaskPermissions } from '@/hooks/useModuleSpecificPermissions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Edit, Save, X, Check, Copy, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TaskFormContent } from './forms/TaskFormContent';
import { useTaskComments } from '@/hooks/useTaskComments';
import { useSubtasks } from '@/hooks/useSubtasks';
import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { useTaskStatusOptions, useTaskPriorityOptions } from '@/hooks/useTaskOptions';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';
import { getDefaultCompletionStatus, isTaskDone } from '@/utils/taskStatusUtils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AttachmentSection } from '@/components/attachments/AttachmentSection';

type TaskRecordMode = 'create' | 'edit' | 'view';

interface TaskRecordPageProps {}

export const TaskRecordPage: React.FC<TaskRecordPageProps> = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userProfile } = useAuth();
  
  // Extract mode and task ID from URL parameters
  const mode = (searchParams.get('mode') as TaskRecordMode) || 'view';
  const taskId = searchParams.get('id');
  
  // Hooks
  const { canCreate, canUpdate, canUpdateAssigned, canView, canDelete } = useTaskPermissions();
  const { tasks, updateTask, duplicateTask, isUpdating, isDuplicating } = useTasks();
  const { statusOptions } = useTaskStatusOptions();
  const { priorityOptions } = useTaskPriorityOptions();
  const { users } = useSchoolUsers(true);
  
  // Find the task if we have an ID
  const task = taskId ? tasks.find(t => t.id === taskId) : null;
  
  // Comments and subtasks (only load if viewing/editing existing task)
  const { comments, addSystemComment } = useTaskComments(taskId || '');
  const { subtasks, updateSubtask } = useSubtasks(taskId || '');
  
  // Local state
  const [currentMode, setCurrentMode] = useState<TaskRecordMode>(mode);
  const [isLoading, setIsLoading] = useState(false);

  // Permission checks
  useEffect(() => {
    if (currentMode === 'create' && !canCreate) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to create tasks.",
        variant: "destructive",
      });
      navigate('/app/tasks');
      return;
    }

    if (currentMode === 'view' && !canView) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to view task details.",
        variant: "destructive",
      });
      navigate('/app/tasks');
      return;
    }

    if (currentMode === 'edit') {
      const canEdit = canUpdate || (canUpdateAssigned && task?.assigned_to === userProfile?.id);
      if (!canEdit) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to edit this task.",
          variant: "destructive",
        });
        setCurrentMode('view');
        return;
      }
    }

    // If no task found but we need one
    if ((currentMode === 'view' || currentMode === 'edit') && taskId && !task) {
      toast({
        title: "Task Not Found",
        description: "The requested task could not be found.",
        variant: "destructive",
      });
      navigate('/app/tasks');
      return;
    }
  }, [currentMode, canCreate, canUpdate, canUpdateAssigned, canView, task, taskId, userProfile?.id, navigate, toast]);

  // Handle navigation
  const handleBack = () => {
    navigate('/app/tasks');
  };

  const handleEdit = () => {
    if (taskId) {
      setCurrentMode('edit');
      navigate(`/app/tasks/task_record?mode=edit&id=${taskId}`);
    }
  };

  const handleView = () => {
    if (taskId) {
      setCurrentMode('view');
      navigate(`/app/tasks/task_record?id=${taskId}`);
    }
  };

  // Handle task completion
  const handleCompleteTask = async () => {
    if (!task) return;

    try {
      setIsLoading(true);
      
      // Check if there are incomplete subtasks
      const incompleteSubtasks = subtasks?.filter(subtask => !isTaskDone(subtask.status, statusOptions)) || [];
      
      // Update the main task
      await updateTask({
        id: task.id,
        status: getDefaultCompletionStatus(statusOptions),
        completed_at: new Date().toISOString()
      });

      // If there are incomplete subtasks, ask if they should be completed too
      if (incompleteSubtasks.length > 0) {
        const shouldCompleteSubtasks = confirm(
          `This task has ${incompleteSubtasks.length} incomplete subtask(s). Would you like to complete them as well?`
        );

        if (shouldCompleteSubtasks) {
          for (const subtask of incompleteSubtasks) {
            await updateSubtask({
              id: subtask.id,
              status: getDefaultCompletionStatus(statusOptions),
              completed_at: new Date().toISOString()
            });
          }
          addSystemComment('Task and all subtasks completed');
        } else {
          addSystemComment('Task completed');
        }
      } else {
        addSystemComment('Task completed');
      }

      toast({
        title: "Task Completed",
        description: "The task has been marked as complete.",
      });

    } catch (error) {
      console.error('Error completing task:', error);
      toast({
        title: "Error",
        description: "Failed to complete the task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle task duplication
  const handleDuplicateTask = () => {
    if (!task) return;
    duplicateTask(task.id, {
      onSuccess: () => {
        toast({
          title: "Task Duplicated",
          description: "A copy of this task has been created.",
        });
      }
    });
  };

  // Handle form close
  const handleFormClose = () => {
    navigate('/app/tasks');
  };

  // Handle successful task creation/update
  const handleTaskSaved = () => {
    if (currentMode === 'edit') {
      // Switch to view mode
      handleView();
    }
    // For create mode, TaskFormContent will handle navigation via onTaskCreated
  };

  // Get page title
  const getPageTitle = () => {
    switch (currentMode) {
      case 'create':
        return 'Create New Task';
      case 'edit':
        return `Edit Task: ${task?.task_number || 'N/A'}`;
      case 'view':
        return `Task: ${task?.task_number || 'N/A'}`;
      default:
        return 'Task Record';
    }
  };

  // Get status and priority display info
  const getStatusInfo = () => {
    if (!task) return null;
    const statusOption = statusOptions.find(s => s.value === task.status);
    return statusOption;
  };

  const getPriorityInfo = () => {
    if (!task) return null;
    const priorityOption = priorityOptions.find(p => p.value === task.priority);
    return priorityOption;
  };

  // Get assigned user display name
  const getAssignedUserName = () => {
    if (!task?.assigned_to) return 'Unassigned';
    const user = users.find(u => u.id === task.assigned_to);
    return user ? `${user.last_name}, ${user.first_name}` : 'Unknown User';
  };

  // Render create/edit form
  if (currentMode === 'create' || currentMode === 'edit') {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={handleBack}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tasks
          </Button>
          <h1 className="text-3xl font-bold">{getPageTitle()}</h1>
        </div>
        
        <div className="bg-card rounded-lg border p-6">
          <TaskFormContent
            mode={currentMode}
            task={task}
            onSuccess={handleTaskSaved}
            onCancel={handleFormClose}
            onTaskCreated={() => navigate('/app/tasks')}
            showAttachments={true}
          />
        </div>
      </div>
    );
  }

  // Render combined view/edit mode
  if (currentMode === 'view' && task) {
    const statusInfo = getStatusInfo();
    const priorityInfo = getPriorityInfo();
    const canEdit = canUpdate || (canUpdateAssigned && task.assigned_to === userProfile?.id);
    const isCompleted = isTaskDone(task.status, statusOptions);
    const [newComment, setNewComment] = useState('');
    const [isAddingComment, setIsAddingComment] = useState(false);

    const handleAddComment = async () => {
      if (!newComment.trim()) return;
      
      setIsAddingComment(true);
      try {
        await addSystemComment(newComment);
        setNewComment('');
        toast({
          title: "Comment Added",
          description: "Your comment has been added successfully.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to add comment. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsAddingComment(false);
      }
    };

    return (
      <div className="container mx-auto py-6 px-4">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={handleBack}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tasks
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">
                {task.task_number && (
                  <span className="text-blue-600 font-mono mr-2">
                    {task.task_number} -
                  </span>
                )}
                {task.title}
              </h1>
            </div>
            
            <div className="flex items-center gap-2">
              {canEdit && !isCompleted && (
                <Button 
                  onClick={handleCompleteTask}
                  disabled={isLoading}
                  className="flex items-center gap-2"
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
              
              {canEdit && (
                <Button 
                  onClick={handleEdit}
                  className="flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Number</span>
                    <p className="font-medium">{task.task_number || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Status</span>
                    <div className="mt-1">
                      <Badge className={statusInfo?.color_class || 'bg-gray-100 text-gray-800'}>
                        {statusInfo?.label || task.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Assigned to</span>
                    <p className="font-medium">{getAssignedUserName()}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Priority</span>
                    <div className="mt-1">
                      <Badge className={priorityInfo?.color_class || 'bg-gray-100 text-gray-800'}>
                        {priorityInfo?.label || task.priority}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Created</span>
                    <p className="font-medium">
                      {formatInTimeZone(new Date(task.created_at), 'America/New_York', 'MM/dd/yyyy HH:mm')}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Due Date</span>
                    <p className="font-medium">
                      {task.due_date ? formatInTimeZone(new Date(task.due_date), 'America/New_York', 'MM/dd/yyyy HH:mm') : 'No due date'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Details */}
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <h4 className="font-medium mb-2">Task Description</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {task.description || 'No description provided.'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Attachments and Subtasks - Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Attachments */}
              <Card>
                <CardHeader>
                  <CardTitle>Attachments</CardTitle>
                </CardHeader>
                <CardContent>
                  <AttachmentSection
                    recordType="task"
                    recordId={task.id}
                    canEdit={canEdit}
                    defaultOpen={true}
                  />
                </CardContent>
              </Card>

              {/* Subtasks */}
              <Card>
                <CardHeader>
                  <CardTitle>Subtasks ({subtasks?.length || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                  {subtasks && subtasks.length > 0 ? (
                    <div className="space-y-2">
                      {subtasks.map((subtask) => (
                        <div key={subtask.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => navigate(`/app/tasks/task_record?id=${subtask.id}`)}
                              className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                            >
                              {subtask.task_number}
                            </button>
                            <span className="text-sm">{subtask.title}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {statusOptions.find(s => s.value === subtask.status)?.label || subtask.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No subtasks found.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Column - Comments & History */}
          <div className="space-y-6">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Comments & History
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col h-full">
                {/* Add Comment */}
                <div className="space-y-3 mb-4">
                  <Textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[80px]"
                  />
                  <Button 
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || isAddingComment}
                    size="sm"
                    className="w-fit"
                  >
                    {isAddingComment ? 'Posting...' : 'Post Comment'}
                  </Button>
                </div>

                <Separator className="mb-4" />

                {/* History Tabs */}
                <div className="flex-1 overflow-hidden">
                  <Tabs defaultValue="comments" className="h-full flex flex-col">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="comments">Comments</TabsTrigger>
                      <TabsTrigger value="history">History</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="comments" className="flex-1 overflow-y-auto mt-4">
                      <div className="space-y-3">
                        {comments && comments.length > 0 ? (
                          comments.map((comment) => (
                            <div key={comment.id} className="p-3 bg-muted rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">
                                  {comment.user_profile ? `${comment.user_profile.last_name}, ${comment.user_profile.first_name}` : 'System'}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatInTimeZone(new Date(comment.created_at), 'America/New_York', 'MM/dd/yyyy HH:mm')}
                                </span>
                              </div>
                              <p className="text-sm whitespace-pre-wrap">{comment.comment_text}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-muted-foreground text-sm text-center py-8">No comments yet.</p>
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="history" className="flex-1 overflow-y-auto mt-4">
                      <div className="text-sm text-muted-foreground text-center py-8">
                        History tracking will be implemented here.
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Fallback for invalid states
  return (
    <div className="container mx-auto py-6 px-4">
      <Button 
        variant="outline" 
        onClick={handleBack}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Tasks
      </Button>
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Invalid Request</h2>
        <p className="text-muted-foreground">
          The requested task operation is not valid or you don't have permission to access it.
        </p>
      </div>
    </div>
  );
};