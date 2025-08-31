import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EditableCadetFieldProps {
  type: 'text' | 'select';
  value: string;
  isEditing: boolean;
  onValueChange: (value: string) => void;
  displayValue: string;
  options?: string[];
  placeholder?: string;
}

export const EditableCadetField: React.FC<EditableCadetFieldProps> = ({
  type,
  value,
  isEditing,
  onValueChange,
  displayValue,
  options = [],
  placeholder = "Select..."
}) => {
  if (!isEditing) {
    return <p className="font-medium">{displayValue}</p>;
  }

  if (type === 'select') {
    return (
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Not set</SelectItem>
          {options.map(option => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Input
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      placeholder={placeholder}
      className="w-full"
    />
  );
};