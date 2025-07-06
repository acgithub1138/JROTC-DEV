import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus } from 'lucide-react';
import { JsonField } from '../types';

interface FieldFormProps {
  currentField: Partial<JsonField>;
  dropdownValues: string;
  editingFieldId: string | null;
  onFieldUpdate: (key: keyof JsonField, value: any) => void;
  onDropdownValuesChange: (value: string) => void;
  onAddField: () => void;
  onCancelEdit: () => void;
}

export const FieldForm: React.FC<FieldFormProps> = ({
  currentField,
  dropdownValues,
  editingFieldId,
  onFieldUpdate,
  onDropdownValuesChange,
  onAddField,
  onCancelEdit
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fieldName">Field Name *</Label>
          <Input 
            id="fieldName" 
            value={currentField.name || ''} 
            onChange={e => onFieldUpdate('name', e.target.value)} 
            placeholder="e.g., Overall Appearance" 
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fieldInfo">Field Info</Label>
          <Input 
            id="fieldInfo" 
            value={currentField.fieldInfo || ''} 
            onChange={e => onFieldUpdate('fieldInfo', e.target.value)} 
            placeholder="Information to display under the field..." 
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fieldType">Field Type</Label>
          <Select value={currentField.type} onValueChange={value => onFieldUpdate('type', value as JsonField['type'])}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="section_header">Section Header</SelectItem>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="number">Number</SelectItem>
              <SelectItem value="dropdown">Dropdown</SelectItem>
              <SelectItem value="calculated">Calculated Field</SelectItem>
              <SelectItem value="pause">Pause</SelectItem>
              <SelectItem value="label">Label</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {currentField.type === 'text' && (
          <div className="space-y-2">
            <Label htmlFor="textType">Text Field Type</Label>
            <Select value={currentField.textType} onValueChange={value => onFieldUpdate('textType', value as 'short' | 'notes')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="short">Short Text (75 chars)</SelectItem>
                <SelectItem value="notes">Notes (2500 chars)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {currentField.type === 'dropdown' && (
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="dropdownValues">Dropdown Values (comma-separated)</Label>
            <Input 
              id="dropdownValues" 
              value={dropdownValues} 
              onChange={e => onDropdownValuesChange(e.target.value)} 
              placeholder="e.g., Excellent, Good, Fair, Poor" 
            />
          </div>
        )}

        {currentField.type === 'number' && (
          <div className="space-y-2">
            <Label htmlFor="maxValue">Max Value</Label>
            <Input 
              id="maxValue" 
              type="number" 
              value={currentField.maxValue || 100} 
              onChange={e => onFieldUpdate('maxValue', parseInt(e.target.value))} 
            />
          </div>
        )}

        <div className="flex items-center space-x-2">
          <Switch 
            id="penalty" 
            checked={currentField.penalty || false} 
            onCheckedChange={checked => onFieldUpdate('penalty', checked)} 
          />
          <Label htmlFor="penalty">Penalty Field</Label>
        </div>
      </div>

      <Button type="button" onClick={onAddField} className="w-full" disabled={!currentField.name}>
        <Plus className="w-4 h-4 mr-2" />
        {editingFieldId ? 'Update Field' : 'Add Field'}
      </Button>
      
      {editingFieldId && (
        <Button type="button" variant="outline" onClick={onCancelEdit} className="w-full">
          Cancel Edit
        </Button>
      )}
    </div>
  );
};