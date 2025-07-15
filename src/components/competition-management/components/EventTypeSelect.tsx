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
import { useCompetitionEventTypes } from '../hooks/useCompetitionEventTypes';

interface EventTypeSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const EventTypeSelect: React.FC<EventTypeSelectProps> = ({
  value,
  onValueChange,
  placeholder = "Select event type...",
  disabled = false,
}) => {
  const { eventTypes, isLoading, addEventType, isAddingEventType } = useCompetitionEventTypes();
  const [showAddNew, setShowAddNew] = useState(false);
  const [newValue, setNewValue] = useState('');
  const [open, setOpen] = useState(false);

  const handleAddNew = async () => {
    if (newValue.trim()) {
      try {
        await addEventType(newValue.trim());
        onValueChange(newValue.trim());
        setNewValue('');
        setShowAddNew(false);
        setOpen(false);
      } catch (error) {
        // Error handling is done in the hook
      }
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
          placeholder="Enter new event type..."
          autoFocus
          disabled={isAddingEventType}
        />
        <Button
          type="button"
          onClick={handleAddNew}
          disabled={!newValue.trim() || isAddingEventType}
          size="sm"
        >
          {isAddingEventType ? 'Adding...' : 'Add'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setShowAddNew(false);
            setNewValue('');
          }}
          size="sm"
          disabled={isAddingEventType}
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
            {eventTypes.length === 0 ? (
              <DropdownMenuItem disabled>No event types available</DropdownMenuItem>
            ) : (
              eventTypes.map((eventType) => (
                <DropdownMenuItem
                  key={eventType.id}
                  onClick={() => handleSelectExisting(eventType.name)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === eventType.name ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {eventType.name}
                </DropdownMenuItem>
              ))
            )}
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem
              onClick={() => setShowAddNew(true)}
              className="text-primary"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add new event type...
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};