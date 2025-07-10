import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Option {
  value: string;
  label: string;
  sort_order?: number;
  is_active?: boolean;
}

interface EditableSelectCellProps {
  value: string;
  options: Option[];
  onValueChange: (value: string) => void;
  placeholder?: string;
  sortByOrder?: boolean;
}

export const EditableSelectCell: React.FC<EditableSelectCellProps> = ({
  value,
  options,
  onValueChange,
  placeholder,
  sortByOrder = true,
}) => {
  const filteredOptions = options.filter(option => option.is_active !== false);
  const sortedOptions = sortByOrder 
    ? filteredOptions.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    : filteredOptions;

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-8">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {sortedOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};