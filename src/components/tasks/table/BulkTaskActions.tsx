import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ChevronDown, X, CheckCircle, Clock, User, Calendar, AlertTriangle } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
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
  const { updateTask } = useTasks();
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

  const handleBulkUpdate = async (field: string, value: any) => {
    if (selectedTasks.length === 0) return;
    
    setIsUpdating(true);
    try {
      const updateData = { [field]: value };
      
      await Promise.all(
        selectedTasks.map(taskId => 
          updateTask({ id: taskId, ...updateData })
        )
      );
      
      toast({
        title: "Tasks Updated",
        description: `Successfully updated ${selectedTasks.length} task${selectedTasks.length > 1 ? 's' : ''}`,
      });
      
      onSelectionClear();
    } catch (error) {
      console.error('Failed to update tasks:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update selected tasks. Please try again.",
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
    
    setIsUpdating(true);
    try {
      const now = new Date().toISOString();
      
      await Promise.all(
        selectedTasks.map(taskId => 
          updateTask({ 
            id: taskId, 
            status: getDefaultCancelStatus(statusOptions),
            completed_at: now
          })
        )
      );
      
      toast({
        title: "Tasks Canceled",
        description: `Successfully canceled ${selectedTasks.length} task${selectedTasks.length > 1 ? 's' : ''}`,
      });
      
      onSelectionClear();
      setShowCancelDialog(false);
    } catch (error) {
      console.error('Failed to cancel tasks:', error);
      toast({
        title: "Cancel Failed",
        description: "Failed to cancel selected tasks. Please try again.",
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
              Are you sure you want to cancel {selectedTasks.length} task{selectedTasks.length > 1 ? 's' : ''}?
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800 font-medium">⚠️ This action will:</p>
                <ul className="text-sm text-red-700 mt-1 ml-4 list-disc">
                  <li>Set the status to "Canceled"</li>
                  <li>Mark {selectedTasks.length > 1 ? 'these tasks' : 'this task'} as completed</li>
                  <li>Send notification emails to relevant users</li>
                </ul>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                This action cannot be easily undone. The {selectedTasks.length > 1 ? 'tasks' : 'task'} will need to be manually updated if you change your mind.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowCancelDialog(false)}>
              Keep Tasks
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkCancel}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              disabled={isUpdating}
            >
              {isUpdating ? 'Canceling...' : `Cancel ${selectedTasks.length} Task${selectedTasks.length > 1 ? 's' : ''}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DropdownMenu>
  );
};