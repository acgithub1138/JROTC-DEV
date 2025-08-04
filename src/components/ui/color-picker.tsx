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

  const hasChanged = tempValue !== value;

  return (
    <div className="flex items-center space-x-1">
      <Input
        type="color"
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        disabled={disabled}
        className="w-10 h-6 p-0 rounded border-0"
      />
      <Input
        type="text"
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        disabled={disabled}
        placeholder="#3B82F6"
        className="w-16 h-6 text-xs"
      />
      {hasChanged && (
        <>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSave}
            disabled={disabled}
            className="h-6 w-6 p-0"
          >
            <Check className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancel}
            disabled={disabled}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </>
      )}
    </div>
  );
};