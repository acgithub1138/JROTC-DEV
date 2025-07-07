import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { JsonField } from '../json-field-builder/types';
interface ScoreFieldRendererProps {
  field: JsonField;
  value: any;
  onChange: (fieldId: string, value: any) => void;
  judgeNumber?: string;
}
export const ScoreFieldRenderer: React.FC<ScoreFieldRendererProps> = ({
  field,
  value,
  onChange,
  judgeNumber
}) => {
  const renderField = () => {
    switch (field.type) {
      case 'section_header':
        return <div className="border-b-2 border-primary pb-2">
            <h3 className="text-lg font-bold text-primary">
              {field.name}
            </h3>
          </div>;
      case 'label':
      case 'bold_gray':
      case 'pause':
        return <div className="py-2">
            {field.pauseField ? <div className="bg-muted px-3 py-2 rounded">
                <span className="font-bold">{field.name}</span>
              </div> : <span className="font-medium">{field.name}</span>}
            {field.fieldInfo && <p className="text-sm text-muted-foreground mt-2">{field.fieldInfo}</p>}
          </div>;
      case 'number':
        return <div className="border-b space-y-2 py-px">
            <div className="flex items-center justify-between">
              <Label htmlFor={field.id} className={field.pauseField ? "font-bold bg-muted px-3 py-2 rounded" : "font-medium"}>
                {field.name}
              </Label>
              <div className="flex items-center gap-2">
                <Input 
                  id={field.id} 
                  type="number" 
                  min="0" 
                  max={field.maxValue} 
                  value={value || ''} 
                  onChange={e => {
                    const newValue = e.target.value;
                    if (newValue === '' || (field.maxValue && Number(newValue) <= field.maxValue) || !field.maxValue) {
                      onChange(field.id, newValue);
                    }
                  }} 
                  placeholder={`Max: ${field.maxValue || 'N/A'}`} 
                  className="w-32" 
                />
              </div>
            </div>
            {field.fieldInfo && <p className="text-sm text-muted-foreground">{field.fieldInfo}</p>}
          </div>;
      case 'dropdown':
        return <div className="py-2 border-b space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor={field.id} className={field.pauseField ? "font-bold bg-muted px-3 py-2 rounded" : "font-medium"}>
                {field.name}
              </Label>
              <div className="flex items-center gap-2">
                <Select value={value || ''} onValueChange={val => onChange(field.id, val)}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                   <SelectContent className="bg-background z-50">
                     {field.values && field.values.length > 0 ? field.values.map(option => (
                       <SelectItem key={option} value={option}>
                         {option}
                       </SelectItem>
                     )) : (
                       <SelectItem value="no-options" disabled>
                         No options available (field.values: {JSON.stringify(field.values)})
                       </SelectItem>
                     )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {field.fieldInfo && <p className="text-sm text-muted-foreground">{field.fieldInfo}</p>}
          </div>;
      case 'penalty':
        // Handle checkbox_list penalty type
        if (field.penaltyType === 'checkbox_list') {
        const selectedValues = Array.isArray(value) ? value : [];
        const handleCheckboxChange = (option: string, checked: boolean) => {
          let newValues;
          if (checked) {
            newValues = [...selectedValues, option];
          } else {
            newValues = selectedValues.filter(v => v !== option);
          }
          onChange(field.id, newValues);
        };
        
        return (
          <div className="py-2 border-b space-y-2">
            <div className="space-y-3">
              <Label className={field.pauseField ? "font-bold bg-muted px-3 py-2 rounded" : "font-medium"}>
                {field.name}
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {field.values?.map(option => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${field.id}-${option}`}
                      checked={selectedValues.includes(option)}
                      onCheckedChange={(checked) => handleCheckboxChange(option, checked as boolean)}
                    />
                    <Label htmlFor={`${field.id}-${option}`} className="text-sm font-normal">
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            {field.fieldInfo && <p className="text-sm text-muted-foreground">{field.fieldInfo}</p>}
          </div>
        );
        }
        
        // Handle other penalty types
        // Only show penalty fields for Judge 1
        if (judgeNumber !== 'Judge 1') return null;
        return <div className="border-b space-y-2 py-[4px]">
            <div className="flex items-center justify-between">
              <Label htmlFor={field.id} className="font-medium text-destructive">
                {field.name}
              </Label>
              <div className="flex items-center gap-2">
                {field.penaltyType === 'points' ? <Input id={field.id} type="number" min="0" value={value || ''} onChange={e => onChange(field.id, e.target.value)} placeholder="Violations" className="w-32" /> : field.penaltyType === 'minor_major' ? <Select value={value || ''} onValueChange={val => onChange(field.id, val)}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minor">Minor (-20)</SelectItem>
                      <SelectItem value="major">Major (-50)</SelectItem>
                    </SelectContent>
                  </Select> : <Input id={field.id} type="number" value={value || ''} onChange={e => onChange(field.id, e.target.value)} className="w-32" />}
              </div>
            </div>
            {field.fieldInfo && <p className="text-sm text-muted-foreground">{field.fieldInfo}</p>}
            {field.penaltyType === 'points' && field.pointValue && <p className="text-xs text-destructive">Each violation: {field.pointValue} points</p>}
          </div>;
      case 'text':
        return <div className="py-2 border-b space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor={field.id} className={field.pauseField ? "font-bold bg-muted px-3 py-2 rounded" : "font-medium"}>
                {field.name}
              </Label>
              <div className="flex items-center gap-2">
                <Input id={field.id} type="text" value={value || ''} onChange={e => onChange(field.id, e.target.value)} className="w-32" />
              </div>
            </div>
            {field.fieldInfo && <p className="text-sm text-muted-foreground">{field.fieldInfo}</p>}
          </div>;
      case 'penalty_checkbox':
        // Only show penalty fields for Judge 1
        if (judgeNumber !== 'Judge 1') return null;
        return <div className="border-b space-y-2 py-[4px]">
            <div className="flex items-center justify-between">
              <Label htmlFor={field.id} className="font-medium text-destructive">
                {field.name}
              </Label>
              <div className="flex items-center gap-2">
                <Input id={field.id} type="number" min="0" value={value || ''} onChange={e => onChange(field.id, e.target.value)} placeholder="Count" className="w-32" />
              </div>
            </div>
            {field.fieldInfo && <p className="text-sm text-muted-foreground">{field.fieldInfo}</p>}
            {field.penaltyValue && <p className="text-xs text-destructive">Each penalty: -{field.penaltyValue} points</p>}
          </div>;
      case 'scoring_scale':
        return <div className="border-b space-y-2 py-px">
            <div className="flex items-center justify-between">
              <Label htmlFor={field.id} className={field.pauseField ? "font-bold bg-muted px-3 py-2 rounded" : "font-medium"}>
                {field.name}
              </Label>
              <div className="flex items-center gap-2">
                <Input 
                  id={field.id} 
                  type="number" 
                  min="0" 
                  max={field.pointValue} 
                  value={value || ''} 
                  onChange={e => {
                    const newValue = e.target.value;
                    if (newValue === '' || (field.pointValue && Number(newValue) <= field.pointValue) || !field.pointValue) {
                      onChange(field.id, newValue);
                    }
                  }} 
                  placeholder={`Max: ${field.pointValue || 'N/A'}`} 
                  className="w-32" 
                />
              </div>
            </div>
            {field.fieldInfo && <p className="text-sm text-muted-foreground">{field.fieldInfo}</p>}
            {field.scaleRanges && (
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Poor: {field.scaleRanges.poor.min}-{field.scaleRanges.poor.max}</div>
                <div>Average: {field.scaleRanges.average.min}-{field.scaleRanges.average.max}</div>
                <div>Exceptional: {field.scaleRanges.exceptional.min}-{field.scaleRanges.exceptional.max}</div>
              </div>
            )}
          </div>;
      default:
        return null;
    }
  };
  return <div key={field.id}>{renderField()}</div>;
};