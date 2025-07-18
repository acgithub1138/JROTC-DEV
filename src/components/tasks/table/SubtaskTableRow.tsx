import React, { useState } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableActionButtons } from '@/components/ui/table-action-buttons';
import { format } from 'date-fns';
import { Eye } from 'lucide-react';
import { Subtask, useSubtasks } from '@/hooks/useSubtasks';
import { getStatusLabel, getPriorityLabel, getStatusColorClass, getPriorityColorClass } from '@/utils/taskTableHelpers';
import { TaskStatusOption, TaskPriorityOption } from '@/hooks/useTaskOptions';
import { TaskDescriptionModal } from '../TaskDescriptionModal';
import { useTaskPermissions } from '@/hooks/useModuleSpecificPermissions';
import { useSubtaskSystemComments } from '@/hooks/useSubtaskSystemComments';
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
  const { updateSubtask } = useSubtasks();
  const { handleSystemComment } = useSubtaskSystemComments();
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
  const [isStatusCommentModalOpen, setIsStatusCommentModalOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<string | null>(null);
  
  const { editState, setEditState, cancelEdit, saveEdit, canEditTask } = useTaskTableLogic();

  // Handle subtask cancellation
  const handleCancel = async () => {
    const now = new Date().toISOString();
    await updateSubtask({
      id: subtask.id,
      status: 'canceled',
      completed_at: now
    });
    
    // Add system comment for cancellation
    await handleSystemComment(subtask.id, 'Subtask was canceled');
  };

  // Check if subtask can be canceled (not already done or canceled)
  const canCancel = canUpdate && subtask.status !== 'done' && subtask.status !== 'canceled';

  // Handle status change with comment modal for specific statuses
  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === 'need_information' || newStatus === 'completed') {
      setPendingStatusChange(newStatus);
      setIsStatusCommentModalOpen(true);
    } else {
      // Direct status change for other statuses - we need to use updateSubtask instead of saveEdit
      await updateSubtask({
        id: subtask.id,
        status: newStatus
      });
    }
  };

  const handleStatusChangeWithComment = async (comment: string) => {
    if (pendingStatusChange) {
      // First add the user comment BEFORE status change
      if (comment.trim()) {
        await handleSystemComment(subtask.id, comment);
      }
      
      // Then save the status change (which will trigger email with the fresh comment)
      await updateSubtask({
        id: subtask.id,
        status: pendingStatusChange
      });
      
      // Reset modal state
      setIsStatusCommentModalOpen(false);
      setPendingStatusChange(null);
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
            {subtask.due_date ? format(new Date(subtask.due_date), 'MMM d, yyyy') : 'No due date'}
          </span>
        </TableCell>
        <TableCell className="py-2">
          {format(new Date(subtask.created_at), 'MMM d, yyyy')}
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