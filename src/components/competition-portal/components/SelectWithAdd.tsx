import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SelectWithAddProps {
  value: string;
  onValueChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
  onAddNew?: (newValue: string) => void;
}

export const SelectWithAdd: React.FC<SelectWithAddProps> = ({
  value,
  onValueChange,
  options,
  placeholder = 'Select or add new...',
  disabled = false,
  onAddNew
}) => {
  const ADD_NEW_MARKER = '__ADD_NEW__';
  const [isAdding, setIsAdding] = useState(false);
  const [internalValue, setInternalValue] = useState(value);

  // Sync internal value when external value changes
  useEffect(() => {
    if (value !== internalValue && !isAdding) {
      setInternalValue(value);
    }
  }, [value]);

  const handleSelectChange = (selectedValue: string) => {
    if (selectedValue === ADD_NEW_MARKER) {
      setIsAdding(true);
      setInternalValue('');
      onValueChange('');
    } else {
      setInternalValue(selectedValue);
      onValueChange(selectedValue);
      setIsAdding(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setInternalValue(newVal);
    onValueChange(newVal);
  };

  // Include current value in options if it's not already there
  const displayOptions = React.useMemo(() => {
    if (internalValue && !options.includes(internalValue)) {
      return [internalValue, ...options];
    }
    return options;
  }, [options, internalValue]);

  if (isAdding) {
    return (
      <Input
        value={internalValue}
        onChange={handleInputChange}
        placeholder="Enter new location..."
        disabled={disabled}
        autoFocus
      />
    );
  }

  return (
    <Select value={internalValue || ''} onValueChange={handleSelectChange} disabled={disabled}>
      <SelectTrigger className="bg-background">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="z-[60] bg-popover text-popover-foreground max-h-60 overflow-auto scroll-smooth">
        <SelectItem value={ADD_NEW_MARKER} className="font-medium text-primary">
          + Add New Location
        </SelectItem>
        {displayOptions.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
