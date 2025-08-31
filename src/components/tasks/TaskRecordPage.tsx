import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTasks } from '@/hooks/useTasks';
import { useTaskPermissions } from '@/hooks/useModuleSpecificPermissions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Edit, Save, X, Check, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TaskFormContent } from './forms/TaskFormContent';
import { useTaskComments } from '@/hooks/useTaskComments';
import { useSubtasks } from '@/hooks/useSubtasks';
import { format } from 'date-fns';
import { useTaskStatusOptions, useTaskPriorityOptions } from '@/hooks/useTaskOptions';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';
import { getDefaultCompletionStatus, isTaskDone } from '@/utils/taskStatusUtils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

  // Render view mode
  if (currentMode === 'view' && task) {
    const statusInfo = getStatusInfo();
    const priorityInfo = getPriorityInfo();
    const canEdit = canUpdate || (canUpdateAssigned && task.assigned_to === userProfile?.id);
    const isCompleted = isTaskDone(task.status, statusOptions);

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
              <p className="text-muted-foreground mt-1">
                Created on {format(new Date(task.created_at), 'MMM d, yyyy')}
              </p>
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

        {/* Task Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Information */}
            <Card>
              <CardHeader>
                <CardTitle>Task Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">
                    {task.description || 'No description provided.'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Tabs for Comments, Attachments, etc. */}
            <Card>
              <CardContent className="p-0">
                <Tabs defaultValue="comments" className="w-full">
                  <div className="p-6 pb-0">
                    <TabsList>
                      <TabsTrigger value="comments">Comments</TabsTrigger>
                      <TabsTrigger value="attachments">Attachments</TabsTrigger>
                      <TabsTrigger value="subtasks">Subtasks</TabsTrigger>
                      <TabsTrigger value="email-history">Email History</TabsTrigger>
                    </TabsList>
                  </div>
                  
                  <TabsContent value="comments" className="p-6 pt-4">
                    <div className="text-sm text-muted-foreground">
                      Comments section will be implemented here.
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="attachments" className="p-6 pt-4">
                    <div className="text-sm text-muted-foreground">
                      Attachments section will be implemented here.
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="subtasks" className="p-6 pt-4">
                    <div>
                      <h4 className="font-medium mb-4">Subtasks ({subtasks?.length || 0})</h4>
                      {subtasks && subtasks.length > 0 ? (
                        <div className="space-y-2">
                          {subtasks.map((subtask) => (
                            <div key={subtask.id} className="p-3 border rounded-lg">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="font-medium">{subtask.title}</span>
                                  <Badge className="ml-2" variant="outline">
                                    {statusOptions.find(s => s.value === subtask.status)?.label || subtask.status}
                                  </Badge>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate(`/app/tasks/task_record?id=${subtask.id}`)}
                                >
                                  View Details
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No subtasks found.</p>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="email-history" className="p-6 pt-4">
                    <div className="text-sm text-muted-foreground">
                      Email history will be implemented here.
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status & Priority */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Status & Priority</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-sm text-muted-foreground">Status</span>
                  <div className="mt-1">
                    <Badge className={statusInfo?.color_class || 'bg-gray-100 text-gray-800'}>
                      {statusInfo?.label || task.status}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <span className="text-sm text-muted-foreground">Priority</span>
                  <div className="mt-1">
                    <Badge className={priorityInfo?.color_class || 'bg-gray-100 text-gray-800'}>
                      {priorityInfo?.label || task.priority}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Assignment & Dates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Assignment & Dates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-sm text-muted-foreground">Assigned To</span>
                  <p className="text-sm font-medium">{getAssignedUserName()}</p>
                </div>
                
                <div>
                  <span className="text-sm text-muted-foreground">Due Date</span>
                  <p className="text-sm font-medium">
                    {task.due_date ? format(new Date(task.due_date), 'MMM d, yyyy') : 'No due date'}
                  </p>
                </div>
                
                <div>
                  <span className="text-sm text-muted-foreground">Created</span>
                  <p className="text-sm font-medium">
                    {format(new Date(task.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
                
                {task.completed_at && (
                  <div>
                    <span className="text-sm text-muted-foreground">Completed</span>
                    <p className="text-sm font-medium">
                      {format(new Date(task.completed_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                )}
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