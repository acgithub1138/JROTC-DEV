import React, { useState, useRef } from 'react';
import { Plus, Check } from 'lucide-react';
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
  const [isAdding, setIsAdding] = useState(false);
  const [newValue, setNewValue] = useState('');
  const skipBlurCommit = useRef(false);

  const handleAddNew = () => {
    if (newValue.trim()) {
      onValueChange(newValue.trim());
      if (onAddNew) {
        onAddNew(newValue.trim());
      }
      setNewValue('');
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddNew();
    } else if (e.key === 'Escape') {
      setIsAdding(false);
      setNewValue('');
    }
  };

  if (isAdding) {
    return (
      <div className="flex gap-2">
        <Input
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (!skipBlurCommit.current) {
              handleAddNew();
            }
            skipBlurCommit.current = false;
          }}
          placeholder="Enter new location..."
          autoFocus
          disabled={disabled}
        />
        <Button
          type="button"
          size="sm"
          onMouseDown={() => { skipBlurCommit.current = true; }}
          onClick={handleAddNew}
          disabled={!newValue.trim() || disabled}
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onMouseDown={() => { skipBlurCommit.current = true; }}
          onClick={() => {
            setIsAdding(false);
            setNewValue('');
          }}
          disabled={disabled}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className="flex-1 bg-background">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="z-[60] bg-popover text-popover-foreground max-h-60 overflow-auto scroll-smooth">
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setIsAdding(true)}
        disabled={disabled}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
};
