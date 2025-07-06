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
          <Label htmlFor="fieldType">Field Type</Label>
          <Select value={currentField.type} onValueChange={value => onFieldUpdate('type', value as JsonField['type'])}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="section_header">Section Header</SelectItem>
              <SelectItem value="scoring_scale">Scoring Scale (Poor/Average/Exceptional)</SelectItem>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="number">Number</SelectItem>
              <SelectItem value="dropdown">Dropdown</SelectItem>
              <SelectItem value="penalty_checkbox">Penalty Checkbox</SelectItem>
              <SelectItem value="calculated">Calculated Field</SelectItem>
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

        {currentField.type === 'scoring_scale' && (
          <div className="space-y-4 md:col-span-2">
            <Label>Scoring Scale Ranges</Label>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Poor Range</Label>
                <div className="flex gap-1">
                  <Input 
                    type="number" 
                    placeholder="Min" 
                    value={currentField.scaleRanges?.poor?.min || 1} 
                    onChange={e => onFieldUpdate('scaleRanges', {
                      ...currentField.scaleRanges, 
                      poor: { ...currentField.scaleRanges?.poor, min: parseInt(e.target.value) || 1 }
                    })} 
                  />
                  <Input 
                    type="number" 
                    placeholder="Max" 
                    value={currentField.scaleRanges?.poor?.max || 2} 
                    onChange={e => onFieldUpdate('scaleRanges', {
                      ...currentField.scaleRanges, 
                      poor: { ...currentField.scaleRanges?.poor, max: parseInt(e.target.value) || 2 }
                    })} 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Average Range</Label>
                <div className="flex gap-1">
                  <Input 
                    type="number" 
                    placeholder="Min" 
                    value={currentField.scaleRanges?.average?.min || 3} 
                    onChange={e => onFieldUpdate('scaleRanges', {
                      ...currentField.scaleRanges, 
                      average: { ...currentField.scaleRanges?.average, min: parseInt(e.target.value) || 3 }
                    })} 
                  />
                  <Input 
                    type="number" 
                    placeholder="Max" 
                    value={currentField.scaleRanges?.average?.max || 8} 
                    onChange={e => onFieldUpdate('scaleRanges', {
                      ...currentField.scaleRanges, 
                      average: { ...currentField.scaleRanges?.average, max: parseInt(e.target.value) || 8 }
                    })} 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Exceptional Range</Label>
                <div className="flex gap-1">
                  <Input 
                    type="number" 
                    placeholder="Min" 
                    value={currentField.scaleRanges?.exceptional?.min || 9} 
                    onChange={e => onFieldUpdate('scaleRanges', {
                      ...currentField.scaleRanges, 
                      exceptional: { ...currentField.scaleRanges?.exceptional, min: parseInt(e.target.value) || 9 }
                    })} 
                  />
                  <Input 
                    type="number" 
                    placeholder="Max" 
                    value={currentField.scaleRanges?.exceptional?.max || 10} 
                    onChange={e => onFieldUpdate('scaleRanges', {
                      ...currentField.scaleRanges, 
                      exceptional: { ...currentField.scaleRanges?.exceptional, max: parseInt(e.target.value) || 10 }
                    })} 
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {currentField.type === 'penalty_checkbox' && (
          <div className="space-y-2">
            <Label htmlFor="penaltyValue">Penalty Value</Label>
            <Input 
              id="penaltyValue" 
              type="number" 
              value={currentField.penaltyValue || 1} 
              onChange={e => onFieldUpdate('penaltyValue', parseInt(e.target.value))} 
              placeholder="e.g., 1, 2, 5" 
            />
          </div>
        )}

        {(currentField.type === 'scoring_scale' || currentField.type === 'number' || currentField.type === 'penalty_checkbox') && (
          <div className="space-y-2">
            <Label htmlFor="pointValue">Point Value</Label>
            <Input 
              id="pointValue" 
              type="number" 
              value={currentField.pointValue || 10} 
              onChange={e => onFieldUpdate('pointValue', parseInt(e.target.value))} 
              placeholder="e.g., 10, 30" 
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