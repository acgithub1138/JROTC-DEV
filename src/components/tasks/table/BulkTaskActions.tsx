import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ChevronDown, X, CheckCircle, Clock, User, Calendar, AlertTriangle } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { useSubtasks } from '@/hooks/useSubtasks';
import { useTaskStatusOptions, useTaskPriorityOptions } from '@/hooks/useTaskOptions';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';
import { useToast } from '@/hooks/use-toast';
import { getDefaultCancelStatus } from '@/utils/taskStatusUtils';

interface BulkTaskActionsProps {
  selectedTasks: string[];
  onSelectionClear: () => void;
  canEdit: boolean;
  canDelete: boolean;
}

export const BulkTaskActions: React.FC<BulkTaskActionsProps> = ({
  selectedTasks,
  onSelectionClear,
  canEdit,
  canDelete: canCancel // Renamed since we're canceling, not deleting
}) => {
  const { updateTask, tasks } = useTasks();
  const { updateSubtask } = useSubtasks();
  const { statusOptions } = useTaskStatusOptions();
  const { priorityOptions } = useTaskPriorityOptions();
  const { users } = useSchoolUsers();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  if (selectedTasks.length === 0 || !canEdit) {
    return null;
  }

  const activeUsers = users.filter(user => user.active).sort((a, b) => a.last_name.localeCompare(b.last_name));

  // Helper function to check if an ID belongs to a subtask
  const isSubtaskId = (id: string) => {
    // Check if any task has this id as a subtask by looking for parent_task_id
    // We'll need to get all subtasks to check this
    return id.startsWith('sub_') || false; // This is a simple check, we may need to improve this
  };

  // Helper function to get all tasks and subtasks data
  const getAllTasksAndSubtasks = () => {
    const allTasks = tasks || [];
    const allSubtasks: any[] = []; // We'll collect all subtasks from tasks
    
    // For now, we'll use a different approach - check the selectedTasks against both collections
    return { allTasks, allSubtasks };
  };

  const handleBulkUpdate = async (field: string, value: any) => {
    if (selectedTasks.length === 0) return;
    
    console.log('🔄 Starting bulk update:', { field, value, selectedTasks });
    setIsUpdating(true);
    try {
      const updateData = { [field]: value };
      
      // Determine which IDs are tasks vs subtasks by checking if they exist in the tasks array
      const taskIds = tasks.map(task => task.id);
      
      // Separate tasks and subtasks
      const taskIdsToUpdate = selectedTasks.filter(id => taskIds.includes(id));
      const subtaskIdsToUpdate = selectedTasks.filter(id => !taskIds.includes(id));
      
      console.log('📋 Separated IDs:', { taskIdsToUpdate, subtaskIdsToUpdate });
      
      const updatePromises = [];
      
      // Update tasks
      for (const id of taskIdsToUpdate) {
        console.log(`🔹 Updating task: ${id}`);
        updatePromises.push(updateTask({ id, ...updateData }));
      }
      
      // Update subtasks  
      for (const id of subtaskIdsToUpdate) {
        updatePromises.push(updateSubtask({ id, ...updateData }));
      }
      
      await Promise.all(updatePromises);
      
      toast({
        title: "Items Updated",
        description: `Successfully updated ${selectedTasks.length} item${selectedTasks.length > 1 ? 's' : ''}`,
      });
      
      onSelectionClear();
    } catch (error) {
      console.error('Failed to update items:', error);
      toast({
        title: "Update Failed", 
        description: "Failed to update selected items. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkCancelClick = () => {
    setShowCancelDialog(true);
  };

  const handleBulkCancel = async () => {
    if (selectedTasks.length === 0) return;
    
    console.log('🚫 Starting bulk cancel:', { selectedTasks });
    setIsUpdating(true);
    try {
      const now = new Date().toISOString();
      const cancelStatus = getDefaultCancelStatus(statusOptions);
      console.log('📊 Cancel status:', cancelStatus);
      
      // Determine which IDs are tasks vs subtasks by checking if they exist in the tasks array
      const taskIds = tasks.map(task => task.id);
      
      // Separate tasks and subtasks
      const taskIdsToUpdate = selectedTasks.filter(id => taskIds.includes(id));
      const subtaskIdsToUpdate = selectedTasks.filter(id => !taskIds.includes(id));
      
      console.log('📋 Separated IDs for cancel:', { taskIdsToUpdate, subtaskIdsToUpdate });
      
      const updateData = {
        status: cancelStatus,
        completed_at: now
      };
      
      const updatePromises = [];
      
      // Cancel tasks
      for (const id of taskIdsToUpdate) {
        console.log(`🔹 Canceling task: ${id}`);
        updatePromises.push(updateTask({ id, ...updateData }));
      }
      
      // Cancel subtasks  
      for (const id of subtaskIdsToUpdate) {
        updatePromises.push(updateSubtask({ id, ...updateData }));
      }
      
      await Promise.all(updatePromises);
      
      toast({
        title: "Items Canceled",
        description: `Successfully canceled ${selectedTasks.length} item${selectedTasks.length > 1 ? 's' : ''}`,
      });
      
      onSelectionClear();
      setShowCancelDialog(false);
    } catch (error) {
      console.error('Failed to cancel items:', error);
      toast({
        title: "Cancel Failed",
        description: "Failed to cancel selected items. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkDueDateClear = () => {
    handleBulkUpdate('due_date', null);
  };

  const handleBulkAssignmentClear = () => {
    handleBulkUpdate('assigned_to', null);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isUpdating}>
          {isUpdating ? 'Updating...' : 'Actions'} <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-white w-56">
        {/* Status Updates */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <CheckCircle className="w-4 h-4 mr-2" />
            Change Status
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="bg-white">
            {statusOptions.map((status) => (
              <DropdownMenuItem 
                key={status.value}
                onClick={() => handleBulkUpdate('status', status.value)}
              >
                <div className={`w-3 h-3 rounded-full mr-2 ${status.color_class}`} />
                {status.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Priority Updates */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Clock className="w-4 h-4 mr-2" />
            Change Priority
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="bg-white">
            {priorityOptions.map((priority) => (
              <DropdownMenuItem 
                key={priority.value}
                onClick={() => handleBulkUpdate('priority', priority.value)}
              >
                <div className={`w-3 h-3 rounded-full mr-2 ${priority.color_class}`} />
                {priority.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Assignment Updates */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <User className="w-4 h-4 mr-2" />
            Assign To
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="bg-white">
            <DropdownMenuItem onClick={handleBulkAssignmentClear}>
              <User className="w-4 h-4 mr-2" />
              Unassigned
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {activeUsers.map((user) => (
              <DropdownMenuItem 
                key={user.id}
                onClick={() => handleBulkUpdate('assigned_to', user.id)}
              >
                <User className="w-4 h-4 mr-2" />
                {user.first_name} {user.last_name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Due Date Actions */}
        <DropdownMenuItem onClick={handleBulkDueDateClear}>
          <Calendar className="w-4 h-4 mr-2" />
          Clear Due Date
        </DropdownMenuItem>

        {/* Cancel Action - Only show if user has delete permission */}
        {canCancel && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleBulkCancelClick} className="text-red-600">
              <X className="w-4 h-4 mr-2" />
              Cancel Selected
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Confirm Task Cancellation
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left">
              Are you sure you want to cancel {selectedTasks.length} item{selectedTasks.length > 1 ? 's' : ''}? This will affect both tasks and subtasks that are selected.
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800 font-medium">⚠️ This action will:</p>
                <ul className="text-sm text-red-700 mt-1 ml-4 list-disc">
                  <li>Set the status to "Canceled"</li>
                  <li>Mark {selectedTasks.length > 1 ? 'these items' : 'this item'} as completed</li>
                  <li>Send notification emails to relevant users</li>
                </ul>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                This action cannot be easily undone. The {selectedTasks.length > 1 ? 'items' : 'item'} will need to be manually updated if you change your mind.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowCancelDialog(false)}>
              Keep Items
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkCancel}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              disabled={isUpdating}
            >
              {isUpdating ? 'Canceling...' : `Cancel ${selectedTasks.length} Item${selectedTasks.length > 1 ? 's' : ''}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DropdownMenu>
  );
};