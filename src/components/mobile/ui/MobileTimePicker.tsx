import React from 'react';
import { TimePicker } from '@/components/ui/time-picker';

interface MobileTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
}

export const MobileTimePicker: React.FC<MobileTimePickerProps> = ({
  value,
  onChange,
  label,
  id,
  disabled = false,
  className
}) => {
  return (
    <div className={className}>
      <TimePicker
        id={id}
        label={label}
        value={value}
        onChange={onChange}
      />
    </div>
  );
};