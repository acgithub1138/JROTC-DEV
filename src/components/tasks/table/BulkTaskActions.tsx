import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, Trash2, CheckCircle, Clock, User, Calendar } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { useTaskStatusOptions, useTaskPriorityOptions } from '@/hooks/useTaskOptions';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';
import { useToast } from '@/hooks/use-toast';

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
  canDelete
}) => {
  const { updateTask, deleteTask } = useTasks();
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

  const handleBulkDelete = async () => {
    if (selectedTasks.length === 0) return;
    
    const confirmMessage = `Are you sure you want to delete ${selectedTasks.length} task${selectedTasks.length > 1 ? 's' : ''}?`;
    if (!confirm(confirmMessage)) return;
    
    setIsUpdating(true);
    try {
      await Promise.all(selectedTasks.map(taskId => deleteTask(taskId)));
      
      toast({
        title: "Tasks Deleted",
        description: `Successfully deleted ${selectedTasks.length} task${selectedTasks.length > 1 ? 's' : ''}`,
      });
      
      onSelectionClear();
    } catch (error) {
      console.error('Failed to delete tasks:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete selected tasks. Please try again.",
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

        {/* Delete Action - Only show if user has delete permission */}
        {canDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleBulkDelete} className="text-red-600">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Selected
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};