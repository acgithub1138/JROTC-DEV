
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

interface FieldDefinition {
  value: string;
  label: string;
  dataType: string;
  isNullable: boolean;
}

interface DynamicFieldInputProps {
  field: FieldDefinition;
  value: string;
  onChange: (value: string) => void;
  triggerTable: string;
  users: Array<{ id: string; first_name: string; last_name: string; }>;
  statusOptions: Array<{ value: string; label: string; }>;
  priorityOptions: Array<{ value: string; label: string; }>;
}

export const DynamicFieldInput: React.FC<DynamicFieldInputProps> = ({
  field,
  value,
  onChange,
  triggerTable,
  users,
  statusOptions,
  priorityOptions
}) => {
  const [date, setDate] = React.useState<Date | undefined>(
    value ? new Date(value) : undefined
  );

  const renderFieldInput = () => {
    // Handle special field cases first
    if (field.value === 'status' && triggerTable === 'tasks') {
      return (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (field.value === 'priority' && triggerTable === 'tasks') {
      return (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            {priorityOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    // Handle UUID fields that reference users
    if (field.dataType === 'uuid' && (field.value.includes('assigned') || field.value.includes('user'))) {
      return (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select user" />
          </SelectTrigger>
          <SelectContent>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.first_name} {user.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    // Handle timestamp fields
    if (field.dataType === 'timestamp with time zone' || field.value.includes('date')) {
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, 'PPP') : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(newDate) => {
                setDate(newDate);
                if (newDate) {
                  onChange(newDate.toISOString());
                }
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      );
    }

    // Handle text fields that might be long (description, etc.)
    if (field.value === 'description' || field.value.includes('notes') || field.value.includes('comment')) {
      return (
        <Textarea
          placeholder={`Enter ${field.label.toLowerCase()}...`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    }

    // Handle numeric fields
    if (field.dataType === 'numeric' || field.dataType === 'integer') {
      return (
        <Input
          type="number"
          placeholder={`Enter ${field.label.toLowerCase()}...`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    }

    // Default to text input for all other field types
    return (
      <Input
        type="text"
        placeholder={`Enter ${field.label.toLowerCase()}...`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  };

  return (
    <div>
      <Label>New {field.label}</Label>
      {renderFieldInput()}
      {field.isNullable && (
        <p className="text-xs text-gray-500 mt-1">This field is optional</p>
      )}
    </div>
  );
};
