import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

interface EditableDateCellProps {
  value: Date | null;
  onValueChange: (date: Date | null) => void;
}

export const EditableDateCell: React.FC<EditableDateCellProps> = ({
  value,
  onValueChange,
}) => {
  const handleDateSelect = (date: Date | undefined) => {
    console.log('Due date changed:', date);
    onValueChange(date || null);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-8 text-left">
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, 'MMM d, yyyy') : 'Set date'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleDateSelect}
          disabled={(date) => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            return date < tomorrow;
          }}
          initialFocus
          className="pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  );
};