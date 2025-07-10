
import React from 'react';
import { Edit } from 'lucide-react';
import { Task } from '@/hooks/useTasks';
import { useTaskStatusOptions, useTaskPriorityOptions } from '@/hooks/useTaskOptions';
import { EditableTitleCell } from './editable-cells/EditableTitleCell';
import { EditableSelectCell } from './editable-cells/EditableSelectCell';
import { EditableAssigneeCell } from './editable-cells/EditableAssigneeCell';
import { EditableDateCell } from './editable-cells/EditableDateCell';

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
    const handleSave = (newValue: any) => onSave(task, field, newValue);
    const updateValue = (newValue: any) => setEditState({ ...editState, value: newValue });

    switch (field) {
      case 'title':
        return (
          <EditableTitleCell
            value={editState.value}
            onChange={updateValue}
            onSave={() => handleSave(editState.value)}
            onCancel={onCancel}
          />
        );

      case 'status':
        return (
          <EditableSelectCell
            value={editState.value}
            options={statusOptions.map(opt => ({
              value: opt.value,
              label: opt.label,
              sort_order: opt.sort_order,
              is_active: opt.is_active
            }))}
            onValueChange={(newValue) => {
              console.log('Status changed:', newValue);
              handleSave(newValue);
            }}
          />
        );

      case 'priority':
        return (
          <EditableSelectCell
            value={editState.value}
            options={priorityOptions.map(opt => ({
              value: opt.value,
              label: opt.label,
              sort_order: opt.sort_order,
              is_active: opt.is_active
            }))}
            onValueChange={(newValue) => {
              console.log('Priority changed:', newValue);
              handleSave(newValue);
            }}
          />
        );

      case 'assigned_to':
        return (
          <EditableAssigneeCell
            value={editState.value === 'unassigned' ? null : editState.value}
            users={users}
            onValueChange={handleSave}
          />
        );

      case 'due_date':
        return (
          <EditableDateCell
            value={editState.value}
            onValueChange={handleSave}
          />
        );

      default:
        return <span>{displayValue}</span>;
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
