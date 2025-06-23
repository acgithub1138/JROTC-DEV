
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Edit, Calendar as CalendarIcon, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { EditState } from '../types/TaskDetailTypes';

interface EditableFieldProps {
  field: string;
  currentValue: any;
  displayValue: string | React.ReactNode;
  type?: 'text' | 'select' | 'date';
  options?: any[];
  canEdit: boolean;
  editState: EditState;
  onStartEdit: (field: string, currentValue: any) => void;
  onCancelEdit: () => void;
  onSaveEdit: (field: string) => void;
  onEditStateChange: (editState: EditState) => void;
  onQuickUpdate?: (field: string, value: any) => void;
}

export const EditableField: React.FC<EditableFieldProps> = ({
  field,
  currentValue,
  displayValue,
  type = 'text',
  options,
  canEdit,
  editState,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onEditStateChange,
  onQuickUpdate
}) => {
  const isEditing = editState.field === field;

  if (!canEdit) {
    return <div className="flex items-center">{displayValue}</div>;
  }

  if (isEditing) {
    if (type === 'text') {
      return (
        <div className="flex items-center gap-2">
          <Input
            value={editState.value || ''}
            onChange={(e) => onEditStateChange({ ...editState, value: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSaveEdit(field);
              if (e.key === 'Escape') onCancelEdit();
            }}
            className="h-8"
            autoFocus
          />
          <Button size="sm" variant="ghost" onClick={() => onSaveEdit(field)}>
            <Check className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancelEdit}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      );
    }

    if (type === 'select' && options) {
      return (
        <Select
          value={editState.value}
          onValueChange={(value) => {
            onEditStateChange({ ...editState, value });
            if (onQuickUpdate) {
              setTimeout(() => {
                onQuickUpdate(field, field === 'assigned_to' && value === 'unassigned' ? null : value);
                onCancelEdit();
              }, 100);
            }
          }}
        >
          <SelectTrigger className="h-8 w-auto min-w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (type === 'date') {
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
                onEditStateChange({ ...editState, value: date });
                if (onQuickUpdate) {
                  setTimeout(() => {
                    onQuickUpdate(field, date ? date.toISOString() : null);
                    onCancelEdit();
                  }, 100);
                }
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
      className="cursor-pointer hover:bg-gray-50 rounded px-2 py-1 -mx-2 -my-1 flex items-center gap-2 group"
      onClick={() => onStartEdit(field, currentValue)}
    >
      <div className="flex items-center">{displayValue}</div>
      <Edit className="w-3 h-3 opacity-0 group-hover:opacity-100" />
    </div>
  );
};
