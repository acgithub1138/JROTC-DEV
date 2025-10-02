import React, { useState } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableActionButtons } from '@/components/ui/table-action-buttons';
import { Eye } from 'lucide-react';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
import { convertToUI } from '@/utils/timezoneUtils';
import { Subtask, useSubtasks } from '@/hooks/useSubtasks';
import { getStatusLabel, getPriorityLabel, getStatusColorClass, getPriorityColorClass } from '@/utils/taskTableHelpers';
import { TaskStatusOption, TaskPriorityOption } from '@/hooks/useTaskOptions';
import { TaskDescriptionModal } from '../TaskDescriptionModal';
import { useTaskPermissions } from '@/hooks/useModuleSpecificPermissions';
import { useSubtaskSystemComments } from '@/hooks/useSubtaskSystemComments';
import { useSubtaskComments } from '@/hooks/useSubtaskComments';
import { StatusChangeCommentModal } from '../dialogs/StatusChangeCommentModal';
import { EditableCell } from './EditableCell';
import { useTaskTableLogic } from '@/hooks/useTaskTableLogic';

interface SubtaskTableRowProps {
  subtask: Subtask;
  isSelected: boolean;
  statusOptions: TaskStatusOption[];
  priorityOptions: TaskPriorityOption[];
  users: any[];
  onTaskSelect: (task: Subtask) => void;
  onSelectTask: (taskId: string, checked: boolean) => void;
}

export const SubtaskTableRow: React.FC<SubtaskTableRowProps> = ({
  subtask,
  isSelected,
  statusOptions,
  priorityOptions,
  users,
  onTaskSelect,
  onSelectTask,
}) => {
  const { canUpdate } = useTaskPermissions();
  const { timezone } = useSchoolTimezone();
  const { updateSubtask } = useSubtasks();
  const { handleSystemComment } = useSubtaskSystemComments();
  const { addComment } = useSubtaskComments(subtask.id);
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
  const [isStatusCommentModalOpen, setIsStatusCommentModalOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<string | null>(null);
  
  const { editState, setEditState, cancelEdit, saveEdit, canEditTask } = useTaskTableLogic();

  // Helper function to handle field changes with system comments
  const handleFieldChange = async (field: string, newValue: any, oldValue: any) => {
    const updateData = { id: subtask.id, [field]: newValue };
    
    try {
      await updateSubtask(updateData);
      
      // Add system comment for tracked fields
      const trackedFields = ['status', 'priority', 'assigned_to', 'due_date', 'title', 'description'];
      if (trackedFields.includes(field)) {
        const { formatSubtaskFieldChangeComment } = await import('@/utils/subtaskCommentUtils');
        const commentText = formatSubtaskFieldChangeComment(
          field,
          oldValue,
          newValue,
          statusOptions,
          priorityOptions,
          users
        );
        handleSystemComment(subtask.id, commentText);
      }
      
      cancelEdit();
    } catch (error) {
      console.error('Failed to update subtask:', error);
      throw error;
    }
  };

  // Handle subtask cancellation
  const handleCancel = async () => {
    setPendingStatusChange('canceled');
    setIsStatusCommentModalOpen(true);
  };

  // Check if subtask can be canceled (not already done or canceled)
  const canCancel = canUpdate && subtask.status !== 'done' && subtask.status !== 'canceled';

  // Handle status change with comment modal for specific statuses
  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === 'need_information' || newStatus === 'completed' || newStatus === 'canceled') {
      setPendingStatusChange(newStatus);
      setIsStatusCommentModalOpen(true);
    } else {
      // For status changes that don't require a comment, use handleFieldChange to add system comment
      const oldStatus = subtask.status;
      await handleFieldChange('status', newStatus, oldStatus);
    }
  };

  const handleStatusChangeWithComment = async (comment: string) => {
    if (pendingStatusChange) {
      try {
        // First add the user comment BEFORE status change
        if (comment.trim()) {
          addComment(comment);
        }
        
        // Save the status change with system comment
        const oldStatus = subtask.status;
        const updateData = {
          id: subtask.id,
          status: pendingStatusChange,
          ...(pendingStatusChange === 'canceled' && { completed_at: new Date().toISOString() })
        };
        
        await updateSubtask(updateData);
        
        // Add system comment for status change
        const { formatSubtaskFieldChangeComment } = await import('@/utils/subtaskCommentUtils');
        const commentText = formatSubtaskFieldChangeComment(
          'status',
          oldStatus,
          pendingStatusChange,
          statusOptions,
          priorityOptions,
          users
        );
        handleSystemComment(subtask.id, commentText);
        
        // Reset modal state and close dropdown
        setIsStatusCommentModalOpen(false);
        setPendingStatusChange(null);
        cancelEdit(); // Close the dropdown after successful update
      } catch (error) {
        // Reset modal state and close dropdown even on error
        setIsStatusCommentModalOpen(false);
        setPendingStatusChange(null);
        cancelEdit();
        throw error;
      }
    }
  };

  const handleCancelStatusChange = () => {
    setIsStatusCommentModalOpen(false);
    setPendingStatusChange(null);
    cancelEdit();
  };

  return (
    <>
      <TableRow key={subtask.id} className="group bg-muted/20">
        <TableCell className="py-2">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelectTask(subtask.id, checked as boolean)}
          />
        </TableCell>
        <TableCell className="font-medium py-2 text-right">
          <button
            onClick={() => onTaskSelect(subtask)}
            className={`px-2 py-1 rounded text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-bold ${
              subtask.due_date && new Date(subtask.due_date) < new Date() && subtask.status !== 'completed' && subtask.status !== 'done'
                ? 'bg-red-100 text-red-800 hover:text-red-900'
                : ''
            }`}
          >
            {subtask.task_number || 'N/A'}
          </button>
        </TableCell>
        <TableCell className="font-medium py-2 pl-4">
          <span>{subtask.title}</span>
        </TableCell>
        <TableCell className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsDescriptionModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
          </Button>
        </TableCell>
        <TableCell className="py-2">
          <EditableCell
            task={subtask as any}
            field="status"
            value={subtask.status}
            displayValue={
              <Badge className={getStatusColorClass(subtask.status, statusOptions)}>
                {getStatusLabel(subtask.status, statusOptions)}
              </Badge>
            }
            editState={editState}
            setEditState={setEditState}
            onSave={(task, field, newValue) => handleStatusChange(newValue)}
            onCancel={cancelEdit}
            canEdit={canUpdate}
          />
        </TableCell>
        <TableCell className="py-2">
          <Badge className={getPriorityColorClass(subtask.priority, priorityOptions)}>
            {getPriorityLabel(subtask.priority, priorityOptions)}
          </Badge>
        </TableCell>
        <TableCell className="py-2">
          <span>
            {subtask.assigned_to_profile
              ? `${subtask.assigned_to_profile.last_name}, ${subtask.assigned_to_profile.first_name}`
              : 'Unassigned'}
          </span>
        </TableCell>
        <TableCell className="py-2">
          <span>
            {subtask.due_date ? convertToUI(subtask.due_date, timezone, 'date') : 'No due date'}
          </span>
        </TableCell>
        <TableCell className="py-2">
          {convertToUI(subtask.created_at, timezone, 'date')}
        </TableCell>
        <TableCell className="py-2">
          <TableActionButtons
            canCancel={canCancel}
            onCancel={handleCancel}
          />
        </TableCell>
      </TableRow>
      
      <TaskDescriptionModal
        isOpen={isDescriptionModalOpen}
        onClose={() => setIsDescriptionModalOpen(false)}
        taskTitle={subtask.title}
        taskDescription={subtask.description}
      />

      <StatusChangeCommentModal
        isOpen={isStatusCommentModalOpen}
        onClose={handleCancelStatusChange}
        onConfirm={handleStatusChangeWithComment}
        newStatus={pendingStatusChange || ''}
        taskTitle={subtask.title}
      />
    </>
  );
};