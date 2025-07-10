
import React, { useState } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Eye } from 'lucide-react';
import { Task } from '@/hooks/useTasks';
import { EditableCell } from './EditableCell';
import { getStatusLabel, getPriorityLabel, getStatusColorClass, getPriorityColorClass } from '@/utils/taskTableHelpers';
import { TaskStatusOption, TaskPriorityOption } from '@/hooks/useTaskOptions';
import { TaskDescriptionModal } from '../TaskDescriptionModal';

interface EditState {
  taskId: string | null;
  field: string | null;
  value: any;
}

interface TaskTableRowProps {
  task: Task;
  isSelected: boolean;
  editState: EditState;
  setEditState: (state: EditState) => void;
  statusOptions: TaskStatusOption[];
  priorityOptions: TaskPriorityOption[];
  users: any[];
  canEdit: boolean;
  canEditTask: (task: Task) => boolean;
  onTaskSelect: (task: Task) => void;
  onSelectTask: (taskId: string, checked: boolean) => void;
  onSave: (task: Task, field: string, newValue: any) => void;
  onCancel: () => void;
  onEditTask: (task: Task) => void;
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
}) => {
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);

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
      </TableRow>
      
      <TaskDescriptionModal
        isOpen={isDescriptionModalOpen}
        onClose={() => setIsDescriptionModalOpen(false)}
        taskTitle={task.title}
        taskDescription={task.description}
      />
    </>
  );
};
