import React, { useState } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Eye } from 'lucide-react';
import { Subtask } from '@/hooks/useSubtasks';
import { getStatusLabel, getPriorityLabel, getStatusColorClass, getPriorityColorClass } from '@/utils/taskTableHelpers';
import { TaskStatusOption, TaskPriorityOption } from '@/hooks/useTaskOptions';
import { TaskDescriptionModal } from '../TaskDescriptionModal';

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
          <span>{subtask.title}</span>
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
          <Badge className={getStatusColorClass(subtask.status, statusOptions)}>
            {getStatusLabel(subtask.status, statusOptions)}
          </Badge>
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