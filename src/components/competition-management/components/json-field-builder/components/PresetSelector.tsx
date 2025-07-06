import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getPresetOptions } from '../presets';

interface PresetSelectorProps {
  onPresetSelect: (presetKey: string) => void;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({ onPresetSelect }) => {
  const presetOptions = getPresetOptions();

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="presetSelect" className="text-sm">Load Preset:</Label>
      <Select onValueChange={(value) => value && onPresetSelect(value)}>
        <SelectTrigger className="w-64 bg-background">
          <SelectValue placeholder="Choose a preset..." />
        </SelectTrigger>
        <SelectContent className="bg-background z-50">
          {presetOptions.map(({ key, label }) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};