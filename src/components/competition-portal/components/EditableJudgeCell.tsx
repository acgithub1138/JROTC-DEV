import React from 'react';
import { Edit } from 'lucide-react';
import { Judge } from '@/hooks/competition-portal/useJudges';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EditState {
  judgeId: string | null;
  field: string | null;
  value: any;
}

interface EditableJudgeCellProps {
  judge: Judge;
  field: string;
  value: any;
  displayValue: string | React.ReactNode;
  editState: EditState;
  setEditState: (state: EditState) => void;
  onSave: (judge: Judge, field: string, newValue: any) => void;
  onCancel: () => void;
  canEdit: boolean;
}

const statusOptions = [
  { value: true, label: 'Available' },
  { value: false, label: 'Unavailable' }
];

export const EditableJudgeCell: React.FC<EditableJudgeCellProps> = ({
  judge,
  field,
  value,
  displayValue,
  editState,
  setEditState,
  onSave,
  onCancel,
  canEdit
}) => {
  const isEditing = editState.judgeId === judge.id && editState.field === field;

  if (!canEdit) {
    return <span>{displayValue}</span>;
  }

  const startEdit = () => {
    setEditState({ judgeId: judge.id, field, value });
  };

  if (isEditing && field === 'available') {
    return (
      <Select 
        value={String(editState.value)} 
        onValueChange={(newValue) => {
          const boolValue = newValue === 'true';
          onSave(judge, field, boolValue);
        }}
      >
        <SelectTrigger className="h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((option) => (
            <SelectItem key={String(option.value)} value={String(option.value)}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
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