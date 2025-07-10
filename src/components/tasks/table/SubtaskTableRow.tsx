import React, { useState } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Eye } from 'lucide-react';
import { Subtask } from '@/hooks/useSubtasks';
import { EditableCell } from './EditableCell';
import { getStatusLabel, getPriorityLabel, getStatusColorClass, getPriorityColorClass } from '@/utils/taskTableHelpers';
import { TaskStatusOption, TaskPriorityOption } from '@/hooks/useTaskOptions';
import { TaskDescriptionModal } from '../TaskDescriptionModal';

interface EditState {
  taskId: string | null;
  field: string | null;
  value: any;
}

interface SubtaskTableRowProps {
  subtask: Subtask;
  isSelected: boolean;
  editState: EditState;
  setEditState: (state: EditState) => void;
  statusOptions: TaskStatusOption[];
  priorityOptions: TaskPriorityOption[];
  users: any[];
  canEdit: boolean;
  canEditTask: (task: Subtask) => boolean;
  onTaskSelect: (task: Subtask) => void;
  onSelectTask: (taskId: string, checked: boolean) => void;
  onSave: (task: Subtask, field: string, newValue: any) => void;
  onCancel: () => void;
  onEditTask: (task: Subtask) => void;
}

export const SubtaskTableRow: React.FC<SubtaskTableRowProps> = ({
  subtask,
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
      <TableRow key={subtask.id} className="group bg-muted/20">
        <TableCell className="py-2">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelectTask(subtask.id, checked as boolean)}
          />
        </TableCell>
        <TableCell className="font-mono text-sm py-2 pl-8 text-right">
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
          <EditableCell
            task={subtask}
            field="title"
            value={subtask.title}
            displayValue={subtask.title}
            editState={editState}
            setEditState={setEditState}
            onSave={onSave}
            onCancel={onCancel}
            canEdit={canEditTask(subtask)}
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
            task={subtask}
            field="status"
            value={subtask.status}
            displayValue={<Badge className={getStatusColorClass(subtask.status, statusOptions)}>{getStatusLabel(subtask.status, statusOptions)}</Badge>}
            editState={editState}
            setEditState={setEditState}
            onSave={onSave}
            onCancel={onCancel}
            canEdit={canEditTask(subtask)}
          />
        </TableCell>
        <TableCell className="py-2">
          <EditableCell
            task={subtask}
            field="priority"
            value={subtask.priority}
            displayValue={<Badge className={getPriorityColorClass(subtask.priority, priorityOptions)}>{getPriorityLabel(subtask.priority, priorityOptions)}</Badge>}
            editState={editState}
            setEditState={setEditState}
            onSave={onSave}
            onCancel={onCancel}
            canEdit={canEditTask(subtask)}
          />
        </TableCell>
        <TableCell className="py-2">
          {canEdit ? (
            <EditableCell
              task={subtask}
              field="assigned_to"
              value={subtask.assigned_to}
              displayValue={
                subtask.assigned_to_profile
                  ? `${subtask.assigned_to_profile.last_name}, ${subtask.assigned_to_profile.first_name}`
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
              {subtask.assigned_to_profile
                ? `${subtask.assigned_to_profile.last_name}, ${subtask.assigned_to_profile.first_name}`
                : 'Unassigned'}
            </span>
          )}
        </TableCell>
        <TableCell className="py-2">
          <EditableCell
            task={subtask}
            field="due_date"
            value={subtask.due_date ? new Date(subtask.due_date) : null}
            displayValue={subtask.due_date ? format(new Date(subtask.due_date), 'MMM d, yyyy') : 'No due date'}
            editState={editState}
            setEditState={setEditState}
            onSave={onSave}
            onCancel={onCancel}
            canEdit={canEditTask(subtask)}
          />
        </TableCell>
        <TableCell className="py-2">
          {format(new Date(subtask.created_at), 'MMM d, yyyy')}
        </TableCell>
        <TableCell className="py-2">
          {/* Actions column - empty for subtasks */}
        </TableCell>
      </TableRow>
      
      <TaskDescriptionModal
        isOpen={isDescriptionModalOpen}
        onClose={() => setIsDescriptionModalOpen(false)}
        taskTitle={subtask.title}
        taskDescription={subtask.description}
      />
    </>
  );
};