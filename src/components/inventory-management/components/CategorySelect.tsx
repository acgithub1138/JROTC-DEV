import React, { useState } from 'react';
import { Check, ChevronDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CategorySelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  isLoading?: boolean;
  disabled?: boolean;
}

export const CategorySelect: React.FC<CategorySelectProps> = ({
  value,
  onValueChange,
  options,
  placeholder = "Select option...",
  isLoading = false,
  disabled = false,
}) => {
  const [showAddNew, setShowAddNew] = useState(false);
  const [newValue, setNewValue] = useState('');
  const [open, setOpen] = useState(false);

  const handleAddNew = () => {
    if (newValue.trim()) {
      onValueChange(newValue.trim());
      setNewValue('');
      setShowAddNew(false);
      setOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddNew();
    } else if (e.key === 'Escape') {
      setShowAddNew(false);
      setNewValue('');
    }
  };

  const handleSelectExisting = (selectedValue: string) => {
    onValueChange(selectedValue);
    setOpen(false);
  };

  if (showAddNew) {
    return (
      <div className="flex gap-2">
        <Input
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter new category..."
          autoFocus
        />
        <Button
          type="button"
          onClick={handleAddNew}
          disabled={!newValue.trim()}
          size="sm"
        >
          Add
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setShowAddNew(false);
            setNewValue('');
          }}
          size="sm"
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {value || placeholder}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-full min-w-[200px]" align="start">
        {isLoading ? (
          <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
        ) : (
          <>
            {options.length === 0 ? (
              <DropdownMenuItem disabled>No options available</DropdownMenuItem>
            ) : (
              options.map((option) => (
                <DropdownMenuItem
                  key={option}
                  onClick={() => handleSelectExisting(option)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option}
                </DropdownMenuItem>
              ))
            )}
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem
              onClick={() => setShowAddNew(true)}
              className="text-primary"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add new...
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};