
import React, { useState } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { TableActionButtons } from '@/components/ui/table-action-buttons';
import { Eye, ChevronRight, ChevronDown, Plus } from 'lucide-react';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
import { formatTimeForDisplay, TIME_FORMATS } from '@/utils/timeDisplayUtils';
import { format } from 'date-fns';
import { Task, useTasks } from '@/hooks/useTasks';
import { Subtask, useSubtasks } from '@/hooks/useSubtasks';
import { SubtaskTableRow } from './SubtaskTableRow';
import { getStatusLabel, getPriorityLabel, getStatusColorClass, getPriorityColorClass } from '@/utils/taskTableHelpers';
import { TaskStatusOption, TaskPriorityOption } from '@/hooks/useTaskOptions';
import { TaskDescriptionModal } from '../TaskDescriptionModal';
import { useTaskPermissions } from '@/hooks/useModuleSpecificPermissions';

import { useTaskSystemComments } from '@/hooks/useTaskSystemComments';
import { useTaskComments } from '@/hooks/useTaskComments';
import { StatusChangeCommentModal } from '../dialogs/StatusChangeCommentModal';
import { SubtaskCompletionModal } from '../dialogs/SubtaskCompletionModal';
import { EditableCell } from './EditableCell';
import { useTaskTableLogic } from '@/hooks/useTaskTableLogic';
import { isTaskDone, getDefaultCompletionStatus, isCompletionStatus, isCancelStatus } from '@/utils/taskStatusUtils';
import { useNavigate } from 'react-router-dom';

interface TaskTableRowProps {
  task: Task | Subtask;
  isSelected: boolean;
  statusOptions: TaskStatusOption[];
  priorityOptions: TaskPriorityOption[];
  users: any[];
  onTaskSelect: (task: Task | Subtask) => void;
  onSelectTask: (taskId: string, checked: boolean) => void;
  expandedTasks: Set<string>;
  onToggleExpanded: (taskId: string) => void;
  selectedTasks: string[];
}

export const TaskTableRow: React.FC<TaskTableRowProps> = ({
  task,
  isSelected,
  statusOptions,
  priorityOptions,
  users,
  onTaskSelect,
  onSelectTask,
  expandedTasks,
  onToggleExpanded,
  selectedTasks,
}) => {
  const navigate = useNavigate();
  const { canCreate, canUpdate, canViewDetails } = useTaskPermissions();
  const { timezone } = useSchoolTimezone();
  const { updateTask } = useTasks();
  const { handleSystemComment } = useTaskSystemComments();
  const { addComment } = useTaskComments(task.id);
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
  
  const [isStatusCommentModalOpen, setIsStatusCommentModalOpen] = useState(false);
  const [isSubtaskCompletionModalOpen, setIsSubtaskCompletionModalOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<string | null>(null);
  const [completeSubtasks, setCompleteSubtasks] = useState(false);
  
  const { editState, setEditState, cancelEdit, saveEdit, canEditTask } = useTaskTableLogic();
  
  // Check if this is a subtask (has parent_task_id property)
  const isSubtask = 'parent_task_id' in task;
  
  // Only fetch subtasks if this is a task, not a subtask
  const { subtasks, updateSubtask } = useSubtasks(isSubtask ? undefined : task.id);
  
  const isExpanded = expandedTasks.has(task.id);
  const hasSubtasks = !isSubtask && subtasks.length > 0;

  // Handle task cancellation
  const handleCancel = async () => {
    setPendingStatusChange('canceled');
    setIsStatusCommentModalOpen(true);
  };

  // Check if task can be canceled (not already done or canceled)
  const canCancel = canUpdate && task.status !== 'done' && task.status !== 'canceled';

  // Handle status change with comment modal for specific statuses
  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === 'need_information' || newStatus === 'completed' || newStatus === 'canceled') {
      setPendingStatusChange(newStatus);
      
      // Check if completing and has incomplete subtasks
      if (isCompletionStatus(newStatus, statusOptions) && !isSubtask) {
        const incompleteSubtasks = subtasks?.filter(subtask => !isTaskDone(subtask.status, statusOptions)) || [];
        if (incompleteSubtasks.length > 0) {
          setIsSubtaskCompletionModalOpen(true);
          return;
        }
      }
      
      setIsStatusCommentModalOpen(true);
    } else {
      // Direct status change for other statuses
      await saveEdit(task, 'status', newStatus, handleSystemComment);
    }
  };

  const handleStatusChangeWithComment = async (comment: string) => {
    if (pendingStatusChange) {
      // First add the user comment BEFORE status change
      if (comment.trim()) {
        addComment(comment);
      }
      
      // Check if this is a cancellation status
      if (isCancelStatus(pendingStatusChange, statusOptions)) {
        console.log('🚫 Handling cancellation status:', pendingStatusChange);
        // For canceled status, also set completed_at
        const now = new Date().toISOString();
        await updateTask({
          id: task.id,
          status: pendingStatusChange,
          completed_at: now
        });
        console.log('✅ Cancellation update completed');
      } else if (isCompletionStatus(pendingStatusChange, statusOptions)) {
        console.log('✅ Handling completion status:', pendingStatusChange);
        // For completion status, update main task and subtasks if requested
        await updateTask({
          id: task.id,
          status: pendingStatusChange,
          completed_at: new Date().toISOString()
        });

        // Update subtasks if requested
        if (completeSubtasks && subtasks) {
          const incompleteSubtasks = subtasks.filter(subtask => !isTaskDone(subtask.status, statusOptions));
          for (const subtask of incompleteSubtasks) {
            await updateSubtask({
              id: subtask.id,
              status: getDefaultCompletionStatus(statusOptions),
              completed_at: new Date().toISOString()
            });
          }
        }

        // Add system comment about completion
        const commentText = completeSubtasks && subtasks?.some(s => !isTaskDone(s.status, statusOptions)) 
          ? 'Task and all subtasks completed' 
          : 'Task completed';
        handleSystemComment(task.id, commentText);
        console.log('✅ Completion update finished');
      } else {
        console.log('ℹ️ Handling other status change:', pendingStatusChange);
        // For other statuses that require comments (like need_information)
        await saveEdit(task, 'status', pendingStatusChange, handleSystemComment);
      }
      
      // Reset modal state
      setIsStatusCommentModalOpen(false);
      setPendingStatusChange(null);
      setCompleteSubtasks(false);
    }
  };

  const handleCancelStatusChange = () => {
    setIsStatusCommentModalOpen(false);
    setIsSubtaskCompletionModalOpen(false);
    setPendingStatusChange(null);
    setCompleteSubtasks(false);
    cancelEdit();
  };

  const handleSubtaskCompletionConfirm = () => {
    setCompleteSubtasks(true);
    setIsSubtaskCompletionModalOpen(false);
    setIsStatusCommentModalOpen(true);
  };

  const handleSubtaskCompletionCancel = () => {
    setCompleteSubtasks(false);
    setIsSubtaskCompletionModalOpen(false);
    setIsStatusCommentModalOpen(true);
  };

  return (
    <>
      <TableRow key={task.id} className="group">
        <TableCell className="py-2">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelectTask(task.id, checked as boolean)}
          />
        </TableCell>
        <TableCell className="font-medium py-2">
          <div className="flex items-center gap-2">
            {!isSubtask && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => onToggleExpanded(task.id)}
                disabled={!hasSubtasks}
              >
                {hasSubtasks ? (
                  isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )
                ) : (
                  <div className="w-4 h-4" />
                )}
              </Button>
            )}
            {isSubtask && (
              <div className="w-4 h-4 flex items-center justify-center">
                {/* Placeholder for alignment - no dot */}
              </div>
            )}
            {canViewDetails ? (
              <button
                onClick={() => navigate(`/app/tasks/task_record?id=${task.id}`)}
                className={`px-2 py-1 rounded text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-bold ${
                  task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed' && task.status !== 'done'
                    ? 'bg-red-100 text-red-800 hover:text-red-900'
                    : ''
                }`}
              >
                {task.task_number || 'N/A'}
              </button>
            ) : (
              <span className={`px-2 py-1 rounded font-bold ${
                task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed' && task.status !== 'done'
                  ? 'bg-red-100 text-red-800'
                  : ''
              }`}>
                {task.task_number || 'N/A'}
              </span>
            )}
          </div>
        </TableCell>
        <TableCell className="font-medium py-2">
          <span>{task.title}</span>
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
            task={task}
            field="status"
            value={task.status}
            displayValue={
              <Badge className={getStatusColorClass(task.status, statusOptions)}>
                {getStatusLabel(task.status, statusOptions)}
              </Badge>
            }
            editState={editState}
            setEditState={setEditState}
            onSave={(task, field, newValue) => handleStatusChange(newValue)}
            onCancel={cancelEdit}
            canEdit={canEditTask(task)}
          />
        </TableCell>
        <TableCell className="py-2">
          <Badge className={getPriorityColorClass(task.priority, priorityOptions)}>
            {getPriorityLabel(task.priority, priorityOptions)}
          </Badge>
        </TableCell>
        <TableCell className="py-2">
          <span>
            {task.assigned_to_profile
              ? `${task.assigned_to_profile.last_name}, ${task.assigned_to_profile.first_name}`
              : 'Unassigned'}
          </span>
        </TableCell>
        <TableCell className="py-2">
          <span>
            {task.due_date ? formatTimeForDisplay(task.due_date, TIME_FORMATS.SHORT_DATE, timezone) : 'No due date'}
          </span>
        </TableCell>
        <TableCell className="py-2">
          {formatTimeForDisplay(task.created_at, TIME_FORMATS.SHORT_DATE, timezone)}
        </TableCell>
        <TableCell className="py-2">
          <TableActionButtons
            canCreate={!isSubtask && canCreate}
            canCancel={canCancel}
            onCreate={() => navigate(`/app/tasks/task_record?mode=create_subtask&parent_task_id=${task.id}`)}
            onCancel={handleCancel}
          />
        </TableCell>
      </TableRow>

      {/* Render subtasks when expanded (only for tasks, not subtasks) */}
      {!isSubtask && isExpanded && subtasks.map((subtask) => (
        <SubtaskTableRow
          key={subtask.id}
          subtask={subtask}
          isSelected={selectedTasks.includes(subtask.id)}
          statusOptions={statusOptions}
          priorityOptions={priorityOptions}
          users={users}
          onTaskSelect={onTaskSelect}
          onSelectTask={onSelectTask}
        />
      ))}
      
      <TaskDescriptionModal
        isOpen={isDescriptionModalOpen}
        onClose={() => setIsDescriptionModalOpen(false)}
        taskTitle={task.title}
        taskDescription={task.description}
      />


      <StatusChangeCommentModal
        isOpen={isStatusCommentModalOpen}
        onClose={handleCancelStatusChange}
        onConfirm={handleStatusChangeWithComment}
        newStatus={pendingStatusChange || ''}
        taskTitle={task.title}
      />

      <SubtaskCompletionModal
        open={isSubtaskCompletionModalOpen}
        onOpenChange={setIsSubtaskCompletionModalOpen}
        onConfirm={handleSubtaskCompletionConfirm}
        onCancel={handleSubtaskCompletionCancel}
      />
    </>
  );
};
