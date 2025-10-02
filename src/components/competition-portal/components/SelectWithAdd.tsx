import React, { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  const [newValue, setNewValue] = useState('');
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
      setNewValue('');
    } else {
      setInternalValue(selectedValue);
      onValueChange(selectedValue);
    }
  };

  const handleAddNew = () => {
    if (newValue.trim()) {
      const trimmedValue = newValue.trim();
      onValueChange(trimmedValue);
      setInternalValue(trimmedValue);
      if (onAddNew) {
        onAddNew(trimmedValue);
      }
      setNewValue('');
      setIsAdding(false);
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setNewValue('');
    // Restore previous value
    if (internalValue) {
      onValueChange(internalValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddNew();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleBlur = () => {
    if (newValue.trim()) {
      handleAddNew();
    } else {
      handleCancel();
    }
  };

  if (isAdding) {
    return (
      <div className="flex gap-2">
        <Input
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder="Enter new location..."
          autoFocus
          disabled={disabled}
        />
        <Button
          type="button"
          size="sm"
          onClick={handleAddNew}
          disabled={!newValue.trim() || disabled}
          onMouseDown={(e) => e.preventDefault()} // Prevent blur
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleCancel}
          disabled={disabled}
          onMouseDown={(e) => e.preventDefault()} // Prevent blur
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
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
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
