import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';

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
  const [tempValue, setTempValue] = useState(value);

  const handleSave = () => {
    onChange(tempValue);
  };

  const handleCancel = () => {
    setTempValue(value);
  };

  return (
    <div className="flex items-center space-x-2">
      <Input
        type="color"
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        disabled={disabled}
        className="w-16 h-8 p-1 rounded"
      />
      <Input
        type="text"
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        disabled={disabled}
        placeholder="#3B82F6"
        className="w-24 h-8"
      />
      <Button
        size="sm"
        variant="ghost"
        onClick={handleSave}
        disabled={disabled || tempValue === value}
        className="h-8 w-8 p-0"
      >
        <Check className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={handleCancel}
        disabled={disabled || tempValue === value}
        className="h-8 w-8 p-0"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};