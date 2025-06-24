
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, X, Edit, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Task } from '@/hooks/useTasks';
import { useTaskStatusOptions, useTaskPriorityOptions } from '@/hooks/useTaskOptions';

interface EditState {
  taskId: string | null;
  field: string | null;
  value: any;
}

interface EditableCellProps {
  task: Task;
  field: string;
  value: any;
  displayValue: string | React.ReactNode;
  editState: EditState;
  setEditState: (state: EditState) => void;
  onSave: (task: Task, field: string, newValue: any) => void;
  onCancel: () => void;
  canEdit: boolean;
  users?: any[];
}

export const EditableCell: React.FC<EditableCellProps> = ({
  task,
  field,
  value,
  displayValue,
  editState,
  setEditState,
  onSave,
  onCancel,
  canEdit,
  users = []
}) => {
  const { statusOptions } = useTaskStatusOptions();
  const { priorityOptions } = useTaskPriorityOptions();
  const isEditing = editState.taskId === task.id && editState.field === field;

  if (!canEdit) {
    return <span>{displayValue}</span>;
  }

  const startEdit = () => {
    // Handle initial value for assigned_to field - convert null to 'unassigned'
    let initialValue = value;
    if (field === 'assigned_to' && value === null) {
      initialValue = 'unassigned';
    }
    
    console.log(`Starting edit for ${field}, initial value:`, initialValue, 'original value:', value);
    setEditState({ taskId: task.id, field, value: initialValue });
  };

  if (isEditing) {
    if (field === 'title') {
      return (
        <div className="flex items-center gap-2">
          <Input
            value={editState.value}
            onChange={(e) => setEditState({ ...editState, value: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSave(task, field, editState.value);
              if (e.key === 'Escape') onCancel();
            }}
            className="h-8"
            autoFocus
          />
          <Button size="sm" variant="ghost" onClick={() => onSave(task, field, editState.value)}>
            <Check className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      );
    }

    if (field === 'status') {
      return (
        <Select
          value={editState.value}
          onValueChange={(newValue) => {
            console.log('Status changed:', newValue);
            onSave(task, field, newValue);
          }}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (field === 'priority') {
      return (
        <Select
          value={editState.value}
          onValueChange={(newValue) => {
            console.log('Priority changed:', newValue);
            onSave(task, field, newValue);
          }}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {priorityOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (field === 'assigned_to') {
      return (
        <Select
          value={editState.value || 'unassigned'}
          onValueChange={(newValue) => {
            const actualValue = newValue === 'unassigned' ? null : newValue;
            console.log('Assigned to changed:', newValue, '-> actualValue:', actualValue);
            onSave(task, field, actualValue);
          }}
        >
          <SelectTrigger className="h-8">
            <SelectValue placeholder="Unassigned" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.first_name} {user.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (field === 'due_date') {
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-8 text-left">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {editState.value ? format(editState.value, 'MMM d, yyyy') : 'Set date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={editState.value}
              onSelect={(date) => {
                console.log('Due date changed:', date);
                onSave(task, field, date);
              }}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      );
    }
  }

  return (
    <div
      className="cursor-pointer hover:bg-gray-50 rounded px-2 py-1 -mx-2 -my-1 flex items-center gap-2"
      onClick={startEdit}
    >
      <span>{displayValue}</span>
      <Edit className="w-3 h-3 opacity-0 group-hover:opacity-100" />
    </div>
  );
};
