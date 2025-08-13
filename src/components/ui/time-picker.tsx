import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  id?: string;
}

export const TimePicker: React.FC<TimePickerProps> = ({ value, onChange, label, id }) => {
  // Generate hours (00-23) and minutes (00-59)
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  // Parse current value
  const [currentHour, currentMinute] = value ? value.split(':') : ['00', '00'];

  const handleHourChange = (hour: string) => {
    onChange(`${hour}:${currentMinute}`);
  };

  const handleMinuteChange = (minute: string) => {
    onChange(`${currentHour}:${minute}`);
  };

  return (
    <div className="space-y-2">
      {label && <Label htmlFor={id}>{label}</Label>}
      <div className="flex space-x-2">
        <div className="flex-1">
          <Select value={currentHour} onValueChange={handleHourChange}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Hour" />
            </SelectTrigger>
            <SelectContent className="max-h-60 bg-background border border-border">
              {hours.map((hour) => (
                <SelectItem key={hour} value={hour} className="hover:bg-accent">
                  {hour}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-center text-muted-foreground font-medium">
          :
        </div>
        <div className="flex-1">
          <Select value={currentMinute} onValueChange={handleMinuteChange}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Min" />
            </SelectTrigger>
            <SelectContent className="max-h-60 bg-background border border-border">
              {minutes.map((minute) => (
                <SelectItem key={minute} value={minute} className="hover:bg-accent">
                  {minute}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};