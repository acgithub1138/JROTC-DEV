import React from 'react';
import { Input } from '@/components/ui/input';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  return (
    <div className="flex items-center space-x-2">
      <Input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-16 h-8 p-1 rounded"
      />
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="#3B82F6"
        className="w-16 h-8"
      />
    </div>
  );
};