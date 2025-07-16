import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, X, CheckCircle, Clock, User, Calendar } from 'lucide-react';
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

  const handleBulkCancel = async () => {
    if (selectedTasks.length === 0) return;
    
    const confirmMessage = `Are you sure you want to cancel ${selectedTasks.length} task${selectedTasks.length > 1 ? 's' : ''}?`;
    if (!confirm(confirmMessage)) return;
    
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
            <DropdownMenuItem onClick={handleBulkCancel} className="text-red-600">
              <X className="w-4 h-4 mr-2" />
              Cancel Selected
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};