
import React, { useState } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { Eye, ChevronRight, ChevronDown, Plus } from 'lucide-react';
import { Task } from '@/hooks/useTasks';
import { Subtask, useSubtasks } from '@/hooks/useSubtasks';
import { SubtaskTableRow } from './SubtaskTableRow';
import { getStatusLabel, getPriorityLabel, getStatusColorClass, getPriorityColorClass } from '@/utils/taskTableHelpers';
import { TaskStatusOption, TaskPriorityOption } from '@/hooks/useTaskOptions';
import { TaskDescriptionModal } from '../TaskDescriptionModal';
import { useTaskPermissions } from '@/hooks/useModuleSpecificPermissions';
import { CreateSubtaskDialog } from '../dialogs/CreateSubtaskDialog';

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
  const { canCreate } = useTaskPermissions();
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
  const [isCreateSubtaskOpen, setIsCreateSubtaskOpen] = useState(false);
  
  // Check if this is a subtask (has parent_task_id property)
  const isSubtask = 'parent_task_id' in task;
  
  // Only fetch subtasks if this is a task, not a subtask
  const { subtasks } = useSubtasks(isSubtask ? undefined : task.id);
  
  const isExpanded = expandedTasks.has(task.id);
  const hasSubtasks = !isSubtask && subtasks.length > 0;

  // Remove the duplicate subtask handling - this is now handled in TaskTable.tsx

  return (
    <>
      <TableRow key={task.id} className="group">
        <TableCell className="py-2">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelectTask(task.id, checked as boolean)}
          />
        </TableCell>
        <TableCell className="font-mono text-sm py-2">
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
              <div className="w-6 h-6 flex items-center justify-center">
                {/* Placeholder for alignment - no dot */}
              </div>
            )}
            <button
              onClick={() => onTaskSelect(task)}
              className={`px-2 py-1 rounded text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-bold ${
                task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed' && task.status !== 'done'
                  ? 'bg-red-100 text-red-800 hover:text-red-900'
                  : ''
              }`}
            >
              {task.task_number || 'N/A'}
            </button>
          </div>
        </TableCell>
        <TableCell className="font-medium py-2">
          <span>{task.title}</span>
        </TableCell>
        <TableCell className="py-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDescriptionModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            View
          </Button>
        </TableCell>
        <TableCell className="py-2">
          <Badge className={getStatusColorClass(task.status, statusOptions)}>
            {getStatusLabel(task.status, statusOptions)}
          </Badge>
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
            {task.due_date ? format(new Date(task.due_date), 'MMM d, yyyy') : 'No due date'}
          </span>
        </TableCell>
        <TableCell className="py-2">
          {format(new Date(task.created_at), 'MMM d, yyyy')}
        </TableCell>
        <TableCell className="py-2">
          {!isSubtask && canCreate && (
            <div className="flex items-center justify-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsCreateSubtaskOpen(true)}
                    className="h-6 w-6"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add Subtask</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
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

      {!isSubtask && (
        <CreateSubtaskDialog
          isOpen={isCreateSubtaskOpen}
          onClose={() => setIsCreateSubtaskOpen(false)}
          parentTaskId={task.id}
          parentTaskTitle={task.title}
        />
      )}
    </>
  );
};
