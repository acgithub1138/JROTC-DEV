import React from 'react';
import { MobileDatePicker } from './MobileDatePicker';
import { MobileTimePicker } from './MobileTimePicker';

interface MobileDateTimePickerProps {
  dateValue: Date | undefined;
  timeValue: string;
  onDateChange: (date: Date | undefined) => void;
  onTimeChange: (time: string) => void;
  dateLabel?: string;
  timeLabel?: string;
  dateId?: string;
  timeId?: string;
  disabled?: boolean;
  className?: string;
}

export const MobileDateTimePicker: React.FC<MobileDateTimePickerProps> = ({
  dateValue,
  timeValue,
  onDateChange,
  onTimeChange,
  dateLabel,
  timeLabel,
  dateId,
  timeId,
  disabled = false,
  className
}) => {
  return (
    <div className={className}>
      <div className="grid grid-cols-2 gap-4">
        <MobileDatePicker
          id={dateId}
          label={dateLabel}
          value={dateValue}
          onChange={onDateChange}
          disabled={disabled}
        />
        <MobileTimePicker
          id={timeId}
          label={timeLabel}
          value={timeValue}
          onChange={onTimeChange}
          disabled={disabled}
        />
      </div>
    </div>
  );
};