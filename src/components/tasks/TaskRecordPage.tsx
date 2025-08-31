import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTasks } from '@/hooks/useTasks';
import { useSubtasks } from '@/hooks/useSubtasks';
import { useTaskPermissions } from '@/hooks/useModuleSpecificPermissions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Edit, Save, X, Check, Copy, MessageSquare, ArrowUpDown, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TaskFormContent } from './forms/TaskFormContent';
import { SubtaskForm } from './forms/SubtaskForm';
import { useTaskComments } from '@/hooks/useTaskComments';
import { useSubtaskComments } from '@/hooks/useSubtaskComments';
import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { useTaskStatusOptions, useTaskPriorityOptions } from '@/hooks/useTaskOptions';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';
import { getDefaultCompletionStatus, isTaskDone } from '@/utils/taskStatusUtils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AttachmentSection } from '@/components/attachments/AttachmentSection';
import { EmailHistoryTab } from './components/EmailHistoryTab';
import { supabase } from '@/integrations/supabase/client';
type TaskRecordMode = 'create' | 'create_task' | 'create_subtask' | 'edit' | 'view';
type RecordType = 'task' | 'subtask';
interface TaskRecordPageProps {}
export const TaskRecordPage: React.FC<TaskRecordPageProps> = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const {
    userProfile
  } = useAuth();

  // Extract mode and record ID from URL parameters
  const mode = searchParams.get('mode') as TaskRecordMode || 'view';
  const recordId = searchParams.get('id');
  const parentTaskId = searchParams.get('parent_task_id');

  // State to track record type and data
  const [recordType, setRecordType] = useState<RecordType>('task');
  const [record, setRecord] = useState<any>(null);
  const [parentTask, setParentTask] = useState<any>(null);
  const [isLoadingRecord, setIsLoadingRecord] = useState(true);

  // Hooks
  const {
    canCreate,
    canUpdate,
    canUpdateAssigned,
    canView,
    canDelete
  } = useTaskPermissions();
  const {
    tasks,
    updateTask,
    duplicateTask,
    isUpdating,
    isDuplicating
  } = useTasks();
  const {
    subtasks: allSubtasks,
    updateSubtask
  } = useSubtasks();
  const {
    statusOptions
  } = useTaskStatusOptions();
  const {
    priorityOptions
  } = useTaskPriorityOptions();
  const {
    users: allUsers
  } = useSchoolUsers(); // All users for display purposes
  const {
    users: activeUsers
  } = useSchoolUsers(true); // Active users only for editing dropdowns

  // Comments hooks - always call both hooks to avoid conditional hook usage
  const {
    comments: taskComments,
    addSystemComment: addTaskSystemComment
  } = useTaskComments(recordId || '');
  const {
    comments: subtaskComments,
    addComment: addSubtaskComment
  } = useSubtaskComments(recordId || '');

  // Get correct comments and comment functions based on record type
  const comments = recordType === 'task' ? taskComments : subtaskComments;
  const addSystemComment = recordType === 'task' ? addTaskSystemComment : (text: string) => addSubtaskComment(text); // Use regular comment for subtasks

  // Get subtasks for the current record (always call the hook)
  const {
    subtasks: recordSubtasks
  } = useSubtasks(recordId || '');

  // Load record data based on ID
  useEffect(() => {
    const loadRecord = async () => {
      if (!recordId) {
        console.log('No recordId provided');
        // For create modes, set loading to false and handle parent task loading if needed
        if (mode === 'create_subtask' && parentTaskId) {
          setIsLoadingRecord(true);
          const foundParentTask = tasks.find(t => t.id === parentTaskId);
          if (foundParentTask) {
            setParentTask(foundParentTask);
            setRecordType('subtask');
          }
        } else {
          setRecordType(mode === 'create_subtask' ? 'subtask' : 'task');
        }
        setIsLoadingRecord(false);
        return;
      }

      // Prevent reloading if we already have the record
      if (record && record.id === recordId) {
        console.log('Record already loaded');
        return;
      }
      console.log('Loading record with ID:', recordId);
      setIsLoadingRecord(true);

      // Try to find task first
      const foundTask = tasks.find(t => t.id === recordId);
      console.log('Found task in cache:', !!foundTask);
      if (foundTask) {
        console.log('Using cached task data');
        setRecord(foundTask);
        setRecordType('task');
        setParentTask(null);
        setIsLoadingRecord(false);
        return;
      }

      // Try to find subtask
      const foundSubtask = allSubtasks.find(s => s.id === recordId);
      console.log('Found subtask in cache:', !!foundSubtask);
      if (foundSubtask) {
        console.log('Using cached subtask data');
        setRecord(foundSubtask);
        setRecordType('subtask');
        // Find parent task
        const parent = tasks.find(t => t.id === foundSubtask.parent_task_id);
        setParentTask(parent);
        setIsLoadingRecord(false);
        return;
      }

      // Fallback: direct database query
      console.log('Record not found in cache, querying database...');
      try {
        // Check tasks table
        const {
          data: taskData,
          error: taskError
        } = await supabase.from('tasks').select(`*, 
            assigned_to_profile:profiles!tasks_assigned_to_fkey(id, first_name, last_name, email),
            assigned_by_profile:profiles!tasks_assigned_by_fkey(id, first_name, last_name, email)
          `).eq('id', recordId).maybeSingle();
        console.log('Task query result:', {
          taskData: !!taskData,
          taskError
        });
        if (taskData && !taskError) {
          console.log('Found task in database');
          setRecord(taskData);
          setRecordType('task');
          setParentTask(null);
          setIsLoadingRecord(false);
          return;
        }

        // Check subtasks table
        const {
          data: subtaskData,
          error: subtaskError
        } = await supabase.from('subtasks').select(`*,
            assigned_to_profile:profiles!subtasks_assigned_to_fkey(id, first_name, last_name, email),
            assigned_by_profile:profiles!subtasks_assigned_by_fkey(id, first_name, last_name, email)
          `).eq('id', recordId).maybeSingle();
        console.log('Subtask query result:', {
          subtaskData: !!subtaskData,
          subtaskError
        });
        if (subtaskData && !subtaskError) {
          console.log('Found subtask in database');
          setRecord(subtaskData);
          setRecordType('subtask');
          // Get parent task
          const {
            data: parentData
          } = await supabase.from('tasks').select('*').eq('id', subtaskData.parent_task_id).maybeSingle();
          setParentTask(parentData);
          setIsLoadingRecord(false);
          return;
        }

        // Record not found
        console.log('Record not found in database');
        setRecord(null);
        setIsLoadingRecord(false);
      } catch (error) {
        console.error('Error loading record:', error);
        setIsLoadingRecord(false);
      }
    };
    loadRecord();
  }, [recordId, parentTaskId, mode]);

  // Local state - all hooks must be at top level
  const [currentMode, setCurrentMode] = useState<TaskRecordMode>(mode);

  // Update currentMode when URL mode changes
  React.useEffect(() => {
    setCurrentMode(mode);
  }, [mode]);
  const [isLoading, setIsLoading] = useState(false);
  const [sortCommentsNewestFirst, setSortCommentsNewestFirst] = useState(true); // Default: New -> Old
  const [editingSummary, setEditingSummary] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [editedRecord, setEditedRecord] = useState<any>(record || {});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);

  // Update edited record when record changes
  useEffect(() => {
    if (record) {
      setEditedRecord(record);
    }
  }, [record]);

  // Permission checks
  useEffect(() => {
    if (isLoadingRecord) return; // Wait for record to load

    if (currentMode === 'create' && !canCreate) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to create tasks.",
        variant: "destructive"
      });
      navigate('/app/tasks');
      return;
    }
    if (currentMode === 'view' && !canView) {
      toast({
        title: "Access Denied",
        description: `You don't have permission to view ${recordType} details.`,
        variant: "destructive"
      });
      navigate('/app/tasks');
      return;
    }
    if (currentMode === 'edit') {
      const canEdit = canUpdate || canUpdateAssigned && record?.assigned_to === userProfile?.id;
      if (!canEdit) {
        toast({
          title: "Access Denied",
          description: `You don't have permission to edit this ${recordType}.`,
          variant: "destructive"
        });
        setCurrentMode('view');
        return;
      }
    }

    // If no record found but we need one
    if ((currentMode === 'view' || currentMode === 'edit') && recordId && !record && !isLoadingRecord) {
      toast({
        title: `${recordType === 'task' ? 'Task' : 'Subtask'} Not Found`,
        description: `The requested ${recordType} could not be found.`,
        variant: "destructive"
      });
      navigate('/app/tasks');
      return;
    }
  }, [currentMode, canCreate, canUpdate, canUpdateAssigned, canView, record, recordId, recordType, userProfile?.id, navigate, toast, isLoadingRecord]);

  // Handle navigation
  const handleBack = () => {
    if (recordType === 'subtask' && parentTask) {
      // Navigate back to parent task
      navigate(`/app/tasks/task_record?id=${parentTask.id}`);
    } else {
      navigate('/app/tasks');
    }
  };
  const handleEdit = () => {
    if (recordId) {
      setCurrentMode('edit');
      navigate(`/app/tasks/task_record?mode=edit&id=${recordId}`);
    }
  };
  const handleView = () => {
    if (recordId) {
      setCurrentMode('view');
      navigate(`/app/tasks/task_record?id=${recordId}`);
    }
  };

  // Handle record completion
  const handleCompleteRecord = async () => {
    if (!record) return;
    try {
      setIsLoading(true);
      if (recordType === 'task') {
        // Check if there are incomplete subtasks
        const incompleteSubtasks = recordSubtasks?.filter(subtask => !isTaskDone(subtask.status, statusOptions)) || [];

        // Update the main task
        await updateTask({
          id: record.id,
          status: getDefaultCompletionStatus(statusOptions),
          completed_at: new Date().toISOString()
        });

        // If there are incomplete subtasks, ask if they should be completed too
        if (incompleteSubtasks.length > 0) {
          const shouldCompleteSubtasks = confirm(`This task has ${incompleteSubtasks.length} incomplete subtask(s). Would you like to complete them as well?`);
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
      } else {
        // Update subtask
        await updateSubtask({
          id: record.id,
          status: getDefaultCompletionStatus(statusOptions),
          completed_at: new Date().toISOString()
        });
        addSystemComment('Subtask completed');
      }
      toast({
        title: `${recordType === 'task' ? 'Task' : 'Subtask'} Completed`,
        description: `The ${recordType} has been marked as complete.`
      });
    } catch (error) {
      console.error(`Error completing ${recordType}:`, error);
      toast({
        title: "Error",
        description: `Failed to complete the ${recordType}. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle record duplication (only for tasks)
  const handleDuplicateRecord = () => {
    if (!record || recordType !== 'task') return;
    duplicateTask(record.id, {
      onSuccess: () => {
        toast({
          title: "Task Duplicated",
          description: "A copy of this task has been created."
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
    const recordTypeName = recordType === 'task' ? 'Task' : 'Subtask';
    switch (currentMode) {
      case 'create':
        return 'Create New Task';
      // Only tasks can be created from this page
      case 'edit':
        return `Edit ${recordTypeName}: ${record?.task_number || 'N/A'}`;
      case 'view':
        return `${recordTypeName}: ${record?.task_number || 'N/A'}`;
      default:
        return `${recordTypeName} Record`;
    }
  };

  // Get status and priority display info
  const getStatusInfo = () => {
    if (!record) return null;
    const statusOption = statusOptions.find(s => s.value === record.status);
    return statusOption;
  };
  const getPriorityInfo = () => {
    if (!record) return null;
    const priorityOption = priorityOptions.find(p => p.value === record.priority);
    return priorityOption;
  };

  // Handle editing functions
  const handleRecordFieldChange = (field: string, value: any) => {
    setEditedRecord(prev => ({
      ...prev,
      [field]: value
    }));
    setHasUnsavedChanges(true);
  };
  const handleSaveChanges = async () => {
    if (!record || !hasUnsavedChanges) return;
    try {
      setIsLoading(true);

      // Build update object with only changed fields
      const updates: any = {
        id: record.id
      };
      const changedFields: string[] = [];
      if (editedRecord.title !== record.title) {
        updates.title = editedRecord.title;
        changedFields.push('title');
      }
      if (editedRecord.description !== record.description) {
        updates.description = editedRecord.description;
        changedFields.push('description');
      }
      if (editedRecord.priority !== record.priority) {
        updates.priority = editedRecord.priority;
        changedFields.push('priority');
      }
      if (editedRecord.status !== record.status) {
        updates.status = editedRecord.status;
        changedFields.push('status');
      }
      if (editedRecord.assigned_to !== record.assigned_to) {
        updates.assigned_to = editedRecord.assigned_to;
        changedFields.push('assigned_to');
      }
      if (editedRecord.due_date !== record.due_date) {
        updates.due_date = editedRecord.due_date;
        changedFields.push('due_date');
      }
      if (changedFields.length > 0) {
        // Use the appropriate update function
        if (recordType === 'task') {
          await updateTask(updates);
        } else {
          await updateSubtask(updates);
        }

        // Add system comment about changes
        const changeDescription = changedFields.map(field => {
          switch (field) {
            case 'title':
              return `Title changed to "${editedRecord.title}"`;
            case 'description':
              return 'Description updated';
            case 'priority':
              return `Priority changed to ${priorityOptions.find(p => p.value === editedRecord.priority)?.label || editedRecord.priority}`;
            case 'status':
              return `Status changed to ${statusOptions.find(s => s.value === editedRecord.status)?.label || editedRecord.status}`;
            case 'assigned_to':
              return `Assigned to ${allUsers.find(u => u.id === editedRecord.assigned_to) ? `${allUsers.find(u => u.id === editedRecord.assigned_to)?.last_name}, ${allUsers.find(u => u.id === editedRecord.assigned_to)?.first_name}` : 'Unassigned'}`;
            case 'due_date':
              return `Due date changed to ${editedRecord.due_date ? formatInTimeZone(new Date(editedRecord.due_date), 'America/New_York', 'M/d/yyyy') : 'No due date'}`;
            default:
              return `${field} updated`;
          }
        }).join(', ');
        addSystemComment(`${recordType === 'task' ? 'Task' : 'Subtask'} updated: ${changeDescription}`);
        toast({
          title: `${recordType === 'task' ? 'Task' : 'Subtask'} Updated`,
          description: "Your changes have been saved successfully."
        });
      }
      setEditingSummary(false);
      setEditingDescription(false);
      setHasUnsavedChanges(false);
      // Navigate back - for subtasks go to main tasks page, for tasks use normal back behavior
      if (recordType === 'subtask') {
        navigate('/app/tasks');
      } else {
        handleBack();
      }
    } catch (error) {
      console.error(`Error saving ${recordType}:`, error);
      toast({
        title: "Error",
        description: "Failed to save changes. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get assigned user display name
  const getAssignedUserName = () => {
    if (!record?.assigned_to) return 'Unassigned';
    const user = allUsers.find(u => u.id === record.assigned_to);
    return user ? `${user.last_name}, ${user.first_name}` : 'Unknown User';
  };

  // Show loading state
  if (isLoadingRecord) {
    return <div className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>;
  }

  // Render create/edit form for tasks
  if (currentMode === 'create' || currentMode === 'create_task' || currentMode === 'edit' && recordType === 'task') {
    return <div className="container mx-auto py-6 px-4">
        <div className="mb-6">
          <Button variant="outline" onClick={handleBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {recordType === 'subtask' && parentTask ? `Back to ${parentTask.task_number}` : 'Back to Tasks'}
          </Button>
          <h1 className="text-3xl font-bold">{getPageTitle()}</h1>
        </div>
        
        <div className="bg-card rounded-lg border p-6">
          <TaskFormContent mode={currentMode === 'create_task' ? 'create' : currentMode} task={record} onSuccess={handleTaskSaved} onCancel={handleFormClose} onTaskCreated={() => navigate('/app/tasks')} showAttachments={true} />
        </div>
      </div>;
  }

  // Render create subtask form
  if (currentMode === 'create_subtask') {
    return <div className="container mx-auto py-6 px-4">
        <div className="mb-6">
          <Button variant="outline" onClick={handleBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {parentTask ? `Back to ${parentTask.task_number}` : 'Back to Tasks'}
          </Button>
          <h1 className="text-3xl font-bold">Create New Subtask</h1>
          {parentTask && <p className="text-muted-foreground mt-2">
              Creating subtask for: <span className="font-medium">{parentTask.task_number} - {parentTask.title}</span>
            </p>}
        </div>
        
        <div className="bg-card rounded-lg border p-6">
          <SubtaskForm mode="create" open={true} onOpenChange={() => {}} parentTaskId={parentTaskId || undefined} />
        </div>
      </div>;
  }

  // Render combined view/edit mode
  if (currentMode === 'view' && record) {
    const statusInfo = getStatusInfo();
    const priorityInfo = getPriorityInfo();
    const canEdit = canUpdate || canUpdateAssigned && record.assigned_to === userProfile?.id;
    const isCompleted = isTaskDone(record.status, statusOptions);
    const handleAddComment = async () => {
      if (!newComment.trim()) return;
      setIsAddingComment(true);
      try {
        await addSystemComment(newComment);
        setNewComment('');
        // Toast is handled by the mutation hook
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to add comment. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsAddingComment(false);
      }
    };
    return <div className="container mx-auto py-6 px-4">
        {/* Header */}
        <div className="mb-6">
          {recordType === 'subtask' && parentTask ? <div className="flex items-center gap-2 mb-4">
              <Button variant="outline" onClick={() => navigate('/app/tasks')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Tasks
              </Button>
              <span className="text-muted-foreground">/</span>
              <Button variant="outline" onClick={() => navigate(`/app/tasks/task_record?id=${parentTask.id}`)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to {parentTask.task_number}
              </Button>
            </div> : <Button variant="outline" onClick={handleBack} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tasks
            </Button>}
          
          <div className="flex items-center justify-between">
            <div>
               <h1 className="text-3xl font-bold">
                 {record.task_number && <span className="text-blue-600 font-mono mr-2">
                     {record.task_number} -
                   </span>}
                 {record.title}
               </h1>
            </div>
            
             <div className="flex items-center gap-2">
               {canEdit && !isCompleted && <Button onClick={handleCompleteRecord} disabled={isLoading} className="flex items-center gap-2">
                   <Check className="w-4 h-4" />
                   Mark Complete
                 </Button>}
               
               {canCreate && recordType === 'task' && <Button variant="outline" onClick={() => navigate(`/app/tasks/task_record?mode=create_subtask&parent_task_id=${record.id}`)} className="flex items-center gap-2">
                   <Plus className="w-4 h-4" />
                   Create Subtask
                 </Button>}
              
              {canCreate && recordType === 'task' && <Button variant="outline" onClick={handleDuplicateRecord} disabled={isDuplicating} className="flex items-center gap-2">
                  <Copy className="w-4 h-4" />
                  {isDuplicating ? 'Duplicating...' : 'Duplicate'}
                </Button>}
              
              {canEdit && hasUnsavedChanges && <Button onClick={handleSaveChanges} disabled={isLoading} className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>}
            </div>
          </div>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Summary */}
            <Card>
               <CardHeader className="py-[8px]">
                 <CardTitle className="flex items-center justify-between">
                   Summary
                    {canEdit && <Button variant="ghost" size="sm" onClick={() => {
                  if (!editingSummary && record) {
                    setEditedRecord(record); // Ensure we have current values
                  }
                  setEditingSummary(!editingSummary);
                }}>
                      <Edit className="w-4 h-4" />
                    </Button>}
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-muted-foreground">Number</span>
                      <p className="font-medium">{record.task_number || 'N/A'}</p>
                    </div>
                   <div>
                     <span className="text-sm text-muted-foreground">Status</span>
                     <div className="mt-1">
                        {editingSummary ? <Select value={editedRecord.status || ''} onValueChange={value => handleRecordFieldChange('status', value)}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              {statusOptions.map(option => <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>)}
                            </SelectContent>
                          </Select> : <Badge className={statusInfo?.color_class || 'bg-gray-100 text-gray-800'}>
                            {statusInfo?.label || record.status}
                          </Badge>}
                     </div>
                   </div>
                   <div>
                     <span className="text-sm text-muted-foreground">Assigned to</span>
                      {editingSummary ? <Select value={editedRecord.assigned_to || 'unassigned'} onValueChange={value => handleRecordFieldChange('assigned_to', value === 'unassigned' ? null : value)}>
                          <SelectTrigger className="w-full mt-1">
                            <SelectValue placeholder="Select user" />
                          </SelectTrigger>
                           <SelectContent>
                             <SelectItem value="unassigned">Unassigned</SelectItem>
                             {activeUsers.map(user => <SelectItem key={user.id} value={user.id}>
                                 {user.last_name}, {user.first_name}
                               </SelectItem>)}
                           </SelectContent>
                        </Select> : <p className="font-medium">{getAssignedUserName()}</p>}
                   </div>
                   <div>
                     <span className="text-sm text-muted-foreground">Priority</span>
                     <div className="mt-1">
                        {editingSummary ? <Select value={editedRecord.priority || ''} onValueChange={value => handleRecordFieldChange('priority', value)}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                            <SelectContent>
                              {priorityOptions.map(option => <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>)}
                            </SelectContent>
                          </Select> : <Badge className={priorityInfo?.color_class || 'bg-gray-100 text-gray-800'}>
                            {priorityInfo?.label || record.priority}
                          </Badge>}
                     </div>
                   </div>
                   <div>
                       <span className="text-sm text-muted-foreground">Created</span>
                       <p className="font-medium">
                         {formatInTimeZone(new Date(record.created_at), 'America/New_York', 'M/d/yyyy')}
                       </p>
                   </div>
                   <div>
                     <span className="text-sm text-muted-foreground">Due Date</span>
                       {editingSummary ? <Input type="date" value={editedRecord.due_date ? new Date(editedRecord.due_date).toISOString().slice(0, 10) : ''} onChange={e => handleRecordFieldChange('due_date', e.target.value ? new Date(e.target.value).toISOString() : null)} min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)} className="mt-1" /> : <p className="font-medium">
                           {record.due_date ? formatInTimeZone(new Date(record.due_date), 'America/New_York', 'M/d/yyyy') : 'No due date'}
                         </p>}
                   </div>
                 </div>
               </CardContent>
            </Card>

            {/* Details */}
             <Card>
                <CardHeader className="py-[8px]">
                  <CardTitle className="flex items-center justify-between">
                    {recordType === 'task' ? 'Task' : 'Subtask'} Description
                    {canEdit && <Button variant="ghost" size="sm" onClick={() => setEditingDescription(!editingDescription)}>
                      <Edit className="w-4 h-4" />
                    </Button>}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    {editingDescription ? <Textarea value={editedRecord.description || ''} onChange={e => handleRecordFieldChange('description', e.target.value)} className="min-h-[120px]" placeholder={`Enter ${recordType} description...`} /> : <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {record.description || 'No description provided.'}
                      </p>}
                  </div>
                </CardContent>
             </Card>

            {/* Attachments */}
            <Card>
              <CardHeader className="py-[8px]">
                <CardTitle className="flex items-center justify-between">
                  <AttachmentSection recordType={recordType} recordId={record.id} canEdit={canEdit} defaultOpen={true} showTitleWithCount={true} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AttachmentSection recordType={recordType} recordId={record.id} canEdit={canEdit} defaultOpen={true} showContentOnly={true} />
              </CardContent>
            </Card>

            {/* Subtasks - only show for tasks */}
            {recordType === 'task' && <Card>
                <CardHeader className="py-[8px]">
                  <CardTitle>Subtasks ({recordSubtasks?.length || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                  {recordSubtasks && recordSubtasks.length > 0 ? <div className="space-y-2">
                      {recordSubtasks.map(subtask => <div key={subtask.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <button onClick={() => navigate(`/app/tasks/task_record?id=${subtask.id}`)} className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                              {subtask.task_number}
                            </button>
                            <span className="text-sm">{subtask.title}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {statusOptions.find(s => s.value === subtask.status)?.label || subtask.status}
                          </Badge>
                        </div>)}
                    </div> : <p className="text-muted-foreground text-sm">No subtasks found.</p>}
                </CardContent>
              </Card>}

            {/* Parent Task Info - only show for subtasks */}
            {recordType === 'subtask' && parentTask && <Card>
                <CardHeader className="py-[8px]">
                  <CardTitle>Parent Task</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <button onClick={() => navigate(`/app/tasks/task_record?id=${parentTask.id}`)} className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                        {parentTask.task_number}
                      </button>
                      <span className="text-sm">{parentTask.title}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {statusOptions.find(s => s.value === parentTask.status)?.label || parentTask.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>}
          </div>

          {/* Right Column - Comments & History */}
          <div className="space-y-6">
            <Card className="h-full">
              <CardHeader className="py-[8px]">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Comments & History
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col h-[600px] overflow-y-auto">
                 {/* Add Comment */}
                <div className="space-y-3 mb-4">
                  <Textarea placeholder="Add a comment..." value={newComment} onChange={e => setNewComment(e.target.value)} className="min-h-[80px]" />
                  <div className="flex items-center justify-between">
                    <Button onClick={handleAddComment} disabled={!newComment.trim() || isAddingComment} size="sm" className="w-fit">
                      {isAddingComment ? 'Posting...' : 'Post Comment'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setSortCommentsNewestFirst(!sortCommentsNewestFirst)} className="flex items-center gap-2">
                      <ArrowUpDown className="w-4 h-4" />
                      {sortCommentsNewestFirst ? 'Newest First' : 'Oldest First'}
                    </Button>
                  </div>
                </div>

                <Separator className="mb-4" />

                {/* History Tabs */}
                <div className="flex-1 overflow-hidden">
                  <Tabs defaultValue="comments" className="h-full flex flex-col">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="comments">Activity History</TabsTrigger>
                      <TabsTrigger value="history">Email History</TabsTrigger>
                    </TabsList>
                    
                     <TabsContent value="comments" className="flex-1 overflow-y-auto mt-4">
                       <div className="space-y-3">
                         {comments && comments.length > 0 ? comments.slice().sort((a, b) => {
                        const dateA = new Date(a.created_at).getTime();
                        const dateB = new Date(b.created_at).getTime();
                        return sortCommentsNewestFirst ? dateB - dateA : dateA - dateB;
                      }).map(comment => <div key={comment.id} className="p-3 bg-muted rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">
                                  {comment.user_profile ? `${comment.user_profile.last_name}, ${comment.user_profile.first_name}` : 'System'}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatInTimeZone(new Date(comment.created_at), 'America/New_York', 'MM/dd/yyyy HH:mm')}
                                </span>
                              </div>
                              <p className="text-sm whitespace-pre-wrap">{comment.comment_text}</p>
                            </div>) : <p className="text-muted-foreground text-sm text-center py-8">No comments yet.</p>}
                      </div>
                    </TabsContent>
                    
                       <TabsContent value="history" className="flex-1 overflow-y-auto mt-4">
                         <EmailHistoryTab recordId={record.id} />
                       </TabsContent>
                  </Tabs>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>;
  }

  // Fallback for invalid states
  return <div className="container mx-auto py-6 px-4">
      <Button variant="outline" onClick={handleBack} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Tasks
      </Button>
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Invalid Request</h2>
        <p className="text-muted-foreground">
          The requested task operation is not valid or you don't have permission to access it.
        </p>
      </div>
    </div>;
};