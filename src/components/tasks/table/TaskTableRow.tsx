
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
import { EditableCell } from './EditableCell';
import { SubtaskTableRow } from './SubtaskTableRow';
import { getStatusLabel, getPriorityLabel, getStatusColorClass, getPriorityColorClass } from '@/utils/taskTableHelpers';
import { TaskStatusOption, TaskPriorityOption } from '@/hooks/useTaskOptions';
import { TaskDescriptionModal } from '../TaskDescriptionModal';
import { CreateSubtaskDialog } from '../dialogs/CreateSubtaskDialog';

interface EditState {
  taskId: string | null;
  field: string | null;
  value: any;
}

interface TaskTableRowProps {
  task: Task | Subtask;
  isSelected: boolean;
  editState: EditState;
  setEditState: (state: EditState) => void;
  statusOptions: TaskStatusOption[];
  priorityOptions: TaskPriorityOption[];
  users: any[];
  canEdit: boolean;
  canEditTask: (task: Task | Subtask) => boolean;
  onTaskSelect: (task: Task | Subtask) => void;
  onSelectTask: (taskId: string, checked: boolean) => void;
  onSave: (task: Task | Subtask, field: string, newValue: any) => void;
  onCancel: () => void;
  onEditTask: (task: Task | Subtask) => void;
  expandedTasks: Set<string>;
  onToggleExpanded: (taskId: string) => void;
  selectedTasks: string[];
}

export const TaskTableRow: React.FC<TaskTableRowProps> = ({
  task,
  isSelected,
  editState,
  setEditState,
  statusOptions,
  priorityOptions,
  users,
  canEdit,
  canEditTask,
  onTaskSelect,
  onSelectTask,
  onSave,
  onCancel,
  onEditTask,
  expandedTasks,
  onToggleExpanded,
  selectedTasks,
}) => {
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
  const [isCreateSubtaskOpen, setIsCreateSubtaskOpen] = useState(false);
  
  // Check if this is a subtask (has parent_task_id property)
  const isSubtask = 'parent_task_id' in task;
  
  // Only fetch subtasks if this is a task, not a subtask
  const { subtasks, updateSubtask } = useSubtasks(isSubtask ? undefined : task.id);
  
  const isExpanded = expandedTasks.has(task.id);
  const hasSubtasks = !isSubtask && subtasks.length > 0;

  const handleSubtaskSave = async (subtask: Subtask, field: string, newValue: any) => {
    console.log('Saving subtask update:', { subtaskId: subtask.id, field, newValue });

    // Get the old value for comparison
    const oldValue = subtask[field as keyof Subtask];

    // Skip if values are the same
    if (oldValue === newValue) {
      // Clear edit state even if no change
      setEditState({ taskId: null, field: null, value: null });
      return;
    }

    const updateData: any = { id: subtask.id };
    
    // Handle date field conversion
    if (field === 'due_date') {
      updateData.due_date = newValue ? newValue.toISOString() : null;
    } else {
      updateData[field] = newValue;
    }

    console.log('Final subtask update data:', updateData);

    try {
      await updateSubtask(updateData);
      // Clear edit state after successful update
      setEditState({ taskId: null, field: null, value: null });
    } catch (error) {
      console.error('Failed to update subtask:', error);
      // Also clear edit state on error to reset the UI
      setEditState({ taskId: null, field: null, value: null });
    }
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
                <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
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
          <EditableCell
            task={task}
            field="title"
            value={task.title}
            displayValue={task.title}
            editState={editState}
            setEditState={setEditState}
            onSave={onSave}
            onCancel={onCancel}
            canEdit={canEditTask(task)}
          />
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
          <EditableCell
            task={task}
            field="status"
            value={task.status}
            displayValue={<Badge className={getStatusColorClass(task.status, statusOptions)}>{getStatusLabel(task.status, statusOptions)}</Badge>}
            editState={editState}
            setEditState={setEditState}
            onSave={onSave}
            onCancel={onCancel}
            canEdit={canEditTask(task)}
          />
        </TableCell>
        <TableCell className="py-2">
          <EditableCell
            task={task}
            field="priority"
            value={task.priority}
            displayValue={<Badge className={getPriorityColorClass(task.priority, priorityOptions)}>{getPriorityLabel(task.priority, priorityOptions)}</Badge>}
            editState={editState}
            setEditState={setEditState}
            onSave={onSave}
            onCancel={onCancel}
            canEdit={canEditTask(task)}
          />
        </TableCell>
        <TableCell className="py-2">
          {canEdit ? (
            <EditableCell
              task={task}
              field="assigned_to"
              value={task.assigned_to}
              displayValue={
                task.assigned_to_profile
                  ? `${task.assigned_to_profile.last_name}, ${task.assigned_to_profile.first_name}`
                  : 'Unassigned'
              }
              editState={editState}
              setEditState={setEditState}
              onSave={onSave}
              onCancel={onCancel}
              canEdit={canEdit}
              users={users}
            />
          ) : (
            <span>
              {task.assigned_to_profile
                ? `${task.assigned_to_profile.last_name}, ${task.assigned_to_profile.first_name}`
                : 'Unassigned'}
            </span>
          )}
        </TableCell>
        <TableCell className="py-2">
          <EditableCell
            task={task}
            field="due_date"
            value={task.due_date ? new Date(task.due_date) : null}
            displayValue={task.due_date ? format(new Date(task.due_date), 'MMM d, yyyy') : 'No due date'}
            editState={editState}
            setEditState={setEditState}
            onSave={onSave}
            onCancel={onCancel}
            canEdit={canEditTask(task)}
          />
        </TableCell>
        <TableCell className="py-2">
          {format(new Date(task.created_at), 'MMM d, yyyy')}
        </TableCell>
        <TableCell className="py-2">
          {!isSubtask && (
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCreateSubtaskOpen(true)}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-4 w-4" />
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
          editState={editState}
          setEditState={setEditState}
          statusOptions={statusOptions}
          priorityOptions={priorityOptions}
          users={users}
          canEdit={canEdit}
          canEditTask={(s) => canEditTask(s as any)}
          onTaskSelect={onTaskSelect}
          onSelectTask={onSelectTask}
          onSave={handleSubtaskSave}
          onCancel={onCancel}
          onEditTask={(s) => onEditTask(s as any)}
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
