
import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Task } from '@/hooks/useTasks';
import { EditableCell } from './EditableCell';
import { getStatusLabel, getPriorityLabel, getStatusColorClass, getPriorityColorClass } from '@/utils/taskTableHelpers';
import { TaskStatusOption, TaskPriorityOption } from '@/hooks/useTaskOptions';

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
}) => {
  return (
    <TableRow key={task.id} className="group">
      <TableCell>
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelectTask(task.id, checked as boolean)}
        />
      </TableCell>
      <TableCell className="font-mono text-sm">
        <button
          onClick={() => onTaskSelect(task)}
          className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
        >
          {task.task_number || 'N/A'}
        </button>
      </TableCell>
      <TableCell className="font-medium">
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
      <TableCell>
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
      <TableCell>
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
      <TableCell>
        {canEdit ? (
          <EditableCell
            task={task}
            field="assigned_to"
            value={task.assigned_to}
            displayValue={
              task.assigned_to_profile
                ? `${task.assigned_to_profile.first_name} ${task.assigned_to_profile.last_name}`
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
              ? `${task.assigned_to_profile.first_name} ${task.assigned_to_profile.last_name}`
              : 'Unassigned'}
          </span>
        )}
      </TableCell>
      <TableCell>
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
      <TableCell>
        {format(new Date(task.created_at), 'MMM d, yyyy')}
      </TableCell>
    </TableRow>
  );
};
