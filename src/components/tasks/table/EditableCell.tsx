
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, X, Edit, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Task } from '@/hooks/useTasks';

interface EditState {
  taskId: string | null;
  field: string | null;
  value: any;
}

interface EditableCellProps {
  task: Task;
  field: string;
  value: any;
  displayValue: string;
  editState: EditState;
  setEditState: (state: EditState) => void;
  onSave: (task: Task) => void;
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
  const isEditing = editState.taskId === task.id && editState.field === field;

  if (!canEdit) {
    return <span>{displayValue}</span>;
  }

  const startEdit = () => {
    setEditState({ taskId: task.id, field, value });
  };

  if (isEditing) {
    if (field === 'title') {
      return (
        <div className="flex items-center gap-2">
          <Input
            value={editState.value}
            onChange={(e) => setEditState({ ...editState, value: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSave(task);
              if (e.key === 'Escape') onCancel();
            }}
            className="h-8"
            autoFocus
          />
          <Button size="sm" variant="ghost" onClick={() => onSave(task)}>
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
          onValueChange={(value) => {
            setEditState({ ...editState, value });
            setTimeout(() => onSave(task), 100);
          }}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="not_started">Not Started</SelectItem>
            <SelectItem value="working_on_it">Working On It</SelectItem>
            <SelectItem value="stuck">Stuck</SelectItem>
            <SelectItem value="done">Done</SelectItem>
          </SelectContent>
        </Select>
      );
    }

    if (field === 'priority') {
      return (
        <Select
          value={editState.value}
          onValueChange={(value) => {
            setEditState({ ...editState, value });
            setTimeout(() => onSave(task), 100);
          }}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      );
    }

    if (field === 'assigned_to') {
      return (
        <Select
          value={editState.value || ''}
          onValueChange={(value) => {
            setEditState({ ...editState, value: value || null });
            setTimeout(() => onSave(task), 100);
          }}
        >
          <SelectTrigger className="h-8">
            <SelectValue placeholder="Unassigned" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Unassigned</SelectItem>
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
                setEditState({ ...editState, value: date });
                setTimeout(() => onSave(task), 100);
              }}
              initialFocus
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
