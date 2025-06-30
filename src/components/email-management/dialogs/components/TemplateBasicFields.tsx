
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface TemplateBasicFieldsProps {
  formData: {
    name: string;
    source_table: string;
    is_active: boolean;
  };
  onFormChange: (updates: Partial<typeof formData>) => void;
  availableTables: Array<{ name: string; label: string }>;
}

export const TemplateBasicFields: React.FC<TemplateBasicFieldsProps> = ({
  formData,
  onFormChange,
  availableTables,
}) => {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Template Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => onFormChange({ name: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="source_table">Source Table</Label>
          <Select
            value={formData.source_table}
            onValueChange={(value) => onFormChange({ source_table: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a table" />
            </SelectTrigger>
            <SelectContent>
              {availableTables.map((table) => (
                <SelectItem key={table.name} value={table.name}>
                  {table.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => onFormChange({ is_active: checked })}
        />
        <Label htmlFor="is_active">Active</Label>
      </div>
    </>
  );
};
