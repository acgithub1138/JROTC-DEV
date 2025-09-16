import React from 'react';
import { Judge } from '@/hooks/competition-portal/useJudges';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';

interface EditableJudgeCellProps {
  judge: Judge;
  field: string;
  value: any;
  displayValue: string | React.ReactNode;
  onSave: (judge: Judge, field: string, newValue: any) => void;
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
  onSave,
  canEdit
}) => {
  if (!canEdit) {
    return <span>{displayValue}</span>;
  }

  if (field === 'available') {
    return (
      <Select 
        value={String(value)} 
        onValueChange={(newValue) => {
          const boolValue = newValue === 'true';
          onSave(judge, field, boolValue);
        }}
      >
        <SelectTrigger className="w-auto h-8 border-none p-0 bg-transparent hover:bg-muted">
          <Badge variant={value ? 'default' : 'secondary'} className="cursor-pointer">
            {value ? 'Available' : 'Unavailable'}
          </Badge>
        </SelectTrigger>
        <SelectContent className="bg-background border shadow-md z-50">
          {statusOptions.map((option) => (
            <SelectItem key={String(option.value)} value={String(option.value)}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return <span>{displayValue}</span>;
};